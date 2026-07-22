# Gestión de Tokens en el Frontend del ERP

## Visión general

Este documento describe cómo se manejan los tokens de autenticación en todo el frontend del ERP, incluyendo almacenamiento, refresco automático y coordinación entre pestañas. El objetivo es mantener la sesión del usuario activa evitando que tokens inválidos provoquen loops o cierres de sesión inesperados. Toda la lógica se ejecuta completamente del lado del cliente e integra con la API del backend basada en JWT.

Archivos clave involucrados:

| Archivo                                                           | Descripción                                                                                               |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `src/services/BaseService.ts`                                     | Wrapper de Axios con interceptores de request/response y la compuerta de refresh.                         |
| `src/services/auth/tokenManager.ts`                               | Almacenamiento de tokens en memoria, utilidades de decodificación y helpers para la ventana de refresco.  |
| `src/services/auth/tokenRefreshWorker.ts`                         | Scheduler en segundo plano que renueva el token antes de que expire.                                      |
| `src/store/slices/auth/authSlice.ts`                              | Slice de Redux que persiste el token, provee thunks como `loginThunk` y expone `logout`.                  |
| `src/store/storeSetup.ts`                                         | Bootstrap del store, incluyendo sincronización entre pestañas e inicialización del worker de refresh.     |
| `src/templates/layouts/Headers/_partial/Notification.partial.tsx` | Ejemplo de consumidor que usa las validaciones de sesión para evitar llamar a la API estando deslogueado. |

## Flujo en tiempo de ejecución

1. **Login** – `loginThunk` (en `authSlice`) llama a `/login`, extrae el token y lo almacena tanto en Redux como en el `tokenManager` en memoria. Desde ahí, `tokenManager` rastrea timestamps de actividad y la ventana de refresco usando el payload del JWT.

2. **Interceptor de Request** – Cada request saliente (excepto `/login` y `/refresh`) pasa por `BaseService`. Este inyecta el token desde `tokenManager`/Redux en el header `Authorization`. Si ya hay un refresh en progreso, el interceptor espera a que la promesa compartida se resuelva antes de enviar la request, de modo que todas las llamadas reutilicen el mismo token renovado.

3. **Interceptor de Response** – Si una request recibe `401 Unauthorized`, el interceptor dispara la compuerta compartida `performTokenRefresh()`. Solo puede ejecutarse un `POST /refresh` a la vez. Una vez que llega el nuevo token, la request original se reintenta de forma transparente. Si el refresh falla, se cierra la sesión del usuario, se limpian los tokens y se cancelan las requests pendientes.

4. **Worker en segundo plano** – `initTokenRefreshWorker` (inicializado en `storeSetup.ts`) agenda un timer después de cada cambio de token. Calcula el próximo tiempo de refresh para que ocurra `VITE_JWT_REFRESH_MARGIN_SECONDS` segundos antes de la expiración (por defecto 15 s, mínimo 5 s, limitado a la vida útil restante). El worker llama a `triggerTokenRefresh`, que reutiliza la misma compuerta que el interceptor.

5. **Sincronización entre pestañas** – Cuando un token cambia, Redux Persist lo escribe en `localStorage`. Un listener de `storage` en `storeSetup.ts` lee cambios desde otras pestañas, actualiza el token en memoria y hace dispatch de `setToken` para que todas las pestañas compartan el mismo estado de sesión. Los logouts también se propagan inmediatamente.

6. **Consumidores conscientes de la sesión** – Componentes como el dropdown de notificaciones revisan `isAuthenticated` y si existe un token antes de fetchear datos o hacer polling. Esto evita cascadas de 401 que de otro modo dispararían refresh innecesarios.

## Variables de entorno

| Variable                          | Default | Propósito                                                                                                               |
| --------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------- |
| `VITE_API_URL`                    | —       | URL base consumida por `BaseService`.                                                                                   |
| `VITE_JWT_REFRESH_TTL_MINUTES`    | `10080` | Refleja el `refresh_ttl` del backend; se usa para saber si un token aún puede refrescarse.                              |
| `VITE_JWT_REFRESH_MARGIN_SECONDS` | `15`    | Segundos antes de expirar en los que se ejecuta el refresh programado. Debe ser >= 5 y menor que la vida útil restante. |

## Manejo de fallos

### Síntomas

* Respuestas 401 continuas seguidas de fallos en `POST /refresh`.
* La sesión termina inmediatamente después de un intento de refresh.
* El worker en segundo plano ejecuta refresh con demasiada frecuencia o no lo hace nunca.

### Pasos de troubleshooting

1. **Verificar valores de entorno** – Asegúrate de que `VITE_API_URL`, `VITE_JWT_REFRESH_TTL_MINUTES` y `VITE_JWT_REFRESH_MARGIN_SECONDS` coincidan con la configuración del backend. TTL desalineados pueden hacer que el worker piense que el token es refrescable cuando ya no lo es.

2. **Inspeccionar logs de red** – Usa la pestaña Network de las DevTools del navegador:

   * Confirma que, cuando un token expira, solo se emite un `POST /refresh`. Refresh paralelos indican que se está saltando la compuerta; revisa si hay instancias personalizadas de Axios que no usan `BaseService`.
   * Revisa el payload de las respuestas de `/refresh`. Si el backend retorna `401 Token invalid`, es posible que el token haya sido revocado o que la ventana de refresh (backend `refresh_ttl`) haya expirado.

3. **Revisar estado de Redux** – En Redux DevTools, confirma que `auth.access` se actualiza después de un refresh. Si sigue indefinido, es posible que `setToken` no se esté disparando (busca errores en consola en los interceptores).

4. **Conflictos entre pestañas** – Si cerrar sesión en una pestaña no se propaga, verifica que `localStorage` no esté bloqueado y que el evento `storage` se esté disparando. El listener vive en `storeSetup.ts`.

5. **Polling de notificaciones** – Si `/me/notifications` sigue consultando estando deslogueado, asegúrate de que los componentes dependan de `isAuthenticated` antes de hacer dispatch de thunks. Usa como referencia el guard actual en `Notification.partial.tsx`.

6. **Logout inmediato después del refresh** – Normalmente se debe a que el backend invalida tokens si se realizan múltiples refresh muy rápido. Confirma que el margen del worker no esté configurado demasiado alto, forzando intentos de refresh mucho después de que la ventana de refresh se cerró. Usa márgenes pequeños (15 s) en tokens de corta duración.

### Recuperación

* Si el flujo de refresh se cae (por ejemplo, por tokens malformados), los interceptores llaman a `logout()`, limpian `tokenManager`, cancelan requests y navegan a `/login`. El usuario debe volver a autenticarse.
* Cuando la disponibilidad del backend es intermitente, las requests posteriores seguirán disparando la compuerta de refresh. Revisa los logs del servidor para ver fallos en el endpoint de `refresh`.

## Extensión del flujo

Al agregar nuevos clientes de API, importa siempre `BaseService` o `ApiService`. No instancies clientes Axios personalizados; de lo contrario, se omitirán los interceptores y la promesa compartida de refresh.

Si necesitas disparar un refresh manualmente (por ejemplo, cuando el backend notifica al cliente que el token fue rotado), importa `triggerTokenRefresh()` desde `src/services/BaseService.ts`. Devuelve una promesa que se resuelve con el nuevo token o se rechaza con el mismo manejo de error (logout) que usan los interceptores.

## Línea de tiempo de ejemplo

1. El usuario inicia sesión → el token se almacena en Redux y en `tokenManager`.
2. `initTokenRefreshWorker` agenda el refresh para `exp - margin`.
3. Los componentes hacen requests vía `BaseService`; los tokens se adjuntan.
4. El token alcanza el margen de refresh → el worker llama a `triggerTokenRefresh`.
5. Durante el refresh, los interceptores encolan nuevas requests hasta que la promesa se resuelve.
6. El nuevo token se propaga: se actualiza el estado en Redux, se dispara la sync entre pestañas y el worker agenda el siguiente refresh.
7. Si el refresh falla, se hace dispatch de `logout()` y todas las pestañas vuelven a la pantalla de login.

## Referencias

* Configuración JWT del backend: `config/jwt.php`
* Controlador de autenticación: `app/Http/Controllers/AuthController.php`
* Endpoints de notificaciones: `routes/api-notifications.php`


