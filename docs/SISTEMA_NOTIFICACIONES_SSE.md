# 🔔 Sistema de Notificaciones - SSE + Polling Fallback

## 📊 Arquitectura Mejorada

### **Antes (Polling Puro)**

```
Frontend ---cada 60s---> GET /me/notifications ----> Backend
                          ↑ Repetir infinitamente
```

**Problemas:**

- ❌ Latencia de hasta 60 segundos
- ❌ Múltiples requests innecesarios
- ❌ Consume más recursos del servidor
- ❌ No es tiempo real

---

### **Ahora (SSE + Fallback)**

```
Frontend ---> GET /me/notifications/stream ---> Backend (SSE)
    ↓                                              ↓
    └─────── Conexión abierta persistente ────────┘
                        ↓
            Nueva notificación en BD
                        ↓
            Backend push inmediato
                        ↓
            Frontend recibe en < 1 segundo

Si SSE falla → Fallback automático a polling
```

**Ventajas:**

- ✅ **Tiempo real**: Latencia < 1 segundo
- ✅ **Eficiente**: Sin polling innecesario
- ✅ **Robusto**: Fallback automático si SSE falla
- ✅ **Reconexión inteligente**: Backoff exponencial

---

## 🌊 Server-Sent Events (SSE)

### **¿Qué es SSE?**

Es una tecnología HTTP estándar donde:

1. Cliente abre una conexión HTTP GET
2. Servidor **no cierra la conexión**
3. Servidor envía datos cuando ocurren eventos
4. Cliente recibe eventos en tiempo real

**Diferencias con WebSockets:**

| Característica | SSE                              | WebSockets                 |
| -------------- | -------------------------------- | -------------------------- |
| Protocolo      | HTTP                             | ws:// / wss://             |
| Dirección      | Server → Client (unidireccional) | Bidireccional              |
| Reconexión     | Automática                       | Manual                     |
| Fallback       | Sí (polling)                     | No                         |
| Complejidad    | Baja                             | Alta                       |
| Uso ideal      | Notificaciones, logs, updates    | Chat, gaming, colaboración |

**Para notificaciones, SSE es PERFECTO** porque:

- Solo necesitamos recibir (Server → Client)
- Reconexión automática incluida
- Funciona sobre HTTP estándar (sin configuraciones especiales en Nginx)

---

## 🔧 Implementación Frontend

### **1. Conexión Inicial**

```typescript
// Obtener token
const token = localStorage.getItem('token');

// URL del stream con token en query param
// (EventSource no soporta headers personalizados)
const url = `${API_URL}/me/notifications/stream?access_token=${token}&lastEventId=0&history=0`;

// Crear EventSource
const eventSource = new EventSource(url);
```

**Parámetros:**

- `access_token`: JWT del usuario autenticado
- `lastEventId`: Último ID recibido (para reconexión sin perder datos)
- `history`: Notificaciones históricas a recibir al conectar (0 = solo nuevas)

---

### **2. Event Listeners**

```typescript
// Conexión establecida
eventSource.onopen = () => {
	console.log('✅ Conexión SSE establecida');
};

// Nueva notificación recibida
eventSource.addEventListener('notification', (event) => {
	const notification = JSON.parse(event.data);

	// Guardar último ID para reconexión
	sessionStorage.setItem('notif_last_event_id', notification.id);

	// Actualizar Redux store
	dispatch(upsertMany([notification]));

	// Mostrar popup nativo
	new Notification(notification.title, {
		body: notification.message,
		icon: '/logo192.png',
	});
});

// Error o desconexión
eventSource.onerror = (error) => {
	console.error('❌ Error en SSE:', error);

	// EventSource intenta reconectar automáticamente
	// Si falla muchas veces, cambiar a polling
	if (reconnectAttempts > 5) {
		eventSource.close();
		setupPolling(); // Fallback
	}
};
```

---

### **3. Formato de Eventos SSE**

El backend envía datos en este formato:

```
id: 123
event: notification
data: {"id":123,"title":"Producto Creado","message":"...","type_key":"product.created",...}

id: 124
event: notification
data: {"id":124,"title":"Sucursal Actualizada","message":"...","type_key":"branch.updated",...}

: ping

id: 125
event: notification
data: {"id":125,"title":"Invitación Recibida","message":"...","type_key":"invitation.received",...}

```

**Estructura:**

- `id:` → Identificador único (usado para reconexión)
- `event:` → Tipo de evento (`notification`, `heartbeat`, etc.)
- `data:` → JSON con los datos del evento
- Línea vacía → Delimitador de evento
- `: ping` → Comentario (heartbeat para mantener conexión viva)

---

### **4. Reconexión Automática**

EventSource incluye reconexión automática, pero agregamos lógica adicional:

```typescript
let reconnectAttempts = 0;
const maxAttempts = 5;

eventSource.onerror = () => {
	reconnectAttempts++;

	if (reconnectAttempts <= maxAttempts) {
		// Backoff exponencial: 1s, 2s, 4s, 8s, 16s, 30s
		const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);

		setTimeout(() => {
			setupSSEConnection(); // Reintentar
		}, delay);
	} else {
		// Máximo de intentos alcanzado
		setUseSSE(false); // Cambiar a polling
	}
};

// Al reconectar exitosamente
eventSource.onopen = () => {
	reconnectAttempts = 0; // Reset contador
};
```

**Timeline de reconexión:**

```
Intento 1: Espera 1 segundo
Intento 2: Espera 2 segundos
Intento 3: Espera 4 segundos
Intento 4: Espera 8 segundos
Intento 5: Espera 16 segundos
Intento 6: Espera 30 segundos (cap máximo)
Después de 5 intentos fallidos → Cambiar a polling
```

---

## 🔄 Sistema de Fallback

### **Cuándo se Activa Polling:**

1. **EventSource no soportado** (navegador muy viejo)
2. **SSE falla repetidamente** (5+ intentos fallidos)
3. **Token inválido o expirado**
4. **Backend SSE no disponible**

### **Implementación:**

```typescript
const setupPolling = () => {
	// Polling cada 60 segundos
	const interval = setInterval(() => {
		dispatch(fetchNotifications({ per_page: 20 }));
	}, 60000);

	// Refrescar al enfocar ventana
	const handleFocus = () => {
		dispatch(fetchNotifications({ per_page: 20 }));
	};
	window.addEventListener('focus', handleFocus);

	// Cleanup
	return () => {
		clearInterval(interval);
		window.removeEventListener('focus', handleFocus);
	};
};
```

---

## 🔐 Autenticación

### **Problema con EventSource:**

EventSource **NO permite headers personalizados** (como `Authorization: Bearer {token}`).

### **Solución:**

Enviamos el token como **query parameter**:

```typescript
const url = `${API_URL}/me/notifications/stream?access_token=${token}`;
const eventSource = new EventSource(url);
```

**Backend valida el token:**

```php
// StreamController.php
$token = $request->query('access_token') ?? $request->bearerToken();

JWTAuth::setToken($token);
$user = JWTAuth::authenticate();

if (!$user) {
    return response('Unauthorized', 401);
}
```

---

## 📦 Estructura de Datos

### **Notificación Recibida por SSE:**

```typescript
interface UserNotificationDTO {
	id: number;
	status: 'unread' | 'read' | 'ack' | 'assigned';
	bucket: 'Important' | 'Archived' | 'Pending';
	assigned_to: number | null;
	delivered_channels: string[];
	aggregate_count: number;
	read_at: string | null;
	ack_at: string | null;
	created_at: string;

	// Datos del evento
	event: {
		id: number;
		type_key: string; // "product.created"
		type_label: string; // "Producto Creado"
		module: string; // "catalog"
		module_label: string; // "Catálogo"
		priority: 'P1' | 'P2' | 'P3';
		payload: Record<string, any>; // Datos específicos del evento
		scope: {
			company_id?: number;
			subsidiary_id?: number;
			branch_id?: number;
		};
	};

	// Mensaje formateado
	message: string; // "Juan Pérez creó el producto Laptop Dell (SKU: LT-001)"
	origin: 'global' | 'role' | 'user';
}
```

---

## 🎯 Flujo Completo (Ejemplo Real)

### **Escenario: Usuario crea un producto**

#### **1. Backend - Controller**

```php
// BranchProductsController::store()
$product = Product::create([
    'name' => 'Laptop Dell XPS 15',
    'sku' => 'LT-001',
    // ...
]);

// Crear evento de notificación
$event = NotificationEvent::create([
    'type_id' => NotificationType::where('key', 'product.created')->first()->id,
    'entity_type' => 'product',
    'entity_id' => $product->id,
    'branch_id' => $branch->id,
    'priority' => 'P2',
    'payload' => [
        'product_name' => $product->name,
        'sku' => $product->sku,
        'created_by' => $user->name,
        'created_by_id' => $user->id,
    ],
]);
```

#### **2. Backend - Router**

```php
// NotificationRouter::route($event)

// Determinar destinatarios
$users = $this->getUsersForScope($event->scope);

// Para cada usuario elegible
foreach ($users as $user) {
    // Verificar permisos, rate limiting, deduplicación
    if ($this->shouldSendToUser($user, $event)) {
        UserNotification::create([
            'user_id' => $user->id,
            'event_id' => $event->id,
            'status' => 'unread',
            'delivered_channels' => ['inapp'],
        ]);
    }
}
```

#### **3. Backend - SSE Loop**

```php
// StreamController::stream()

while (!connection_aborted() && (time() - $start) < 60) {
    // Buscar notificaciones nuevas
    $newNotifications = UserNotification::where('user_id', $user->id)
        ->where('id', '>', $lastSentId)
        ->orderBy('id', 'asc')
        ->limit(50)
        ->get();

    foreach ($newNotifications as $notif) {
        // Formatear y enviar
        echo "id: {$notif->id}\n";
        echo "event: notification\n";
        echo "data: " . json_encode($notif->toArray()) . "\n\n";

        @ob_flush();
        @flush();

        $lastSentId = $notif->id;
    }

    // Heartbeat
    echo ": ping\n\n";
    @ob_flush();
    @flush();

    usleep(500000); // 0.5 segundos
}
```

**Timeline:**

```
T=0.0s   Usuario crea producto
         ↓
T=0.1s   Backend crea NotificationEvent
         ↓
T=0.2s   Router determina destinatarios
         ↓
T=0.3s   UserNotification insertada en BD
         ↓
T=0.5s   SSE loop detecta nueva notificación
         ↓
T=0.6s   Backend envía evento SSE
         ↓
T=0.7s   Frontend recibe evento
         ↓
T=0.8s   Redux actualizado
         ↓
T=0.9s   Popup nativo mostrado

Total: < 1 segundo desde creación hasta notificación
```

#### **4. Frontend - Recepción**

```typescript
// EventSource recibe evento
eventSource.addEventListener('notification', (event) => {
	const notification = JSON.parse(event.data);
	// notification.id = 123
	// notification.message = "Juan Pérez creó el producto Laptop Dell XPS 15 (SKU: LT-001)"

	// 1. Guardar último ID
	sessionStorage.setItem('notif_last_event_id', '123');

	// 2. Actualizar Redux
	dispatch(upsertMany([notification]));

	// 3. Detectar en useEffect
	// (notification NO está en shownIdsRef.current)

	// 4. Mostrar popup de Windows
	new Notification('Producto Creado', {
		body: notification.message,
		icon: '/logo192.png',
		requireInteraction: true,
	});

	// 5. Agregar a mostrados
	shownIdsRef.current.add(123);
});
```

---

## 🐛 Debugging

### **Verificar Conexión SSE:**

**1. Consola del navegador:**

```
🔔 [NOTIF] ========== SISTEMA DE NOTIFICACIONES INICIADO ==========
🔄 [NOTIF] Configurando sistema de notificaciones...
📥 [NOTIF] Carga inicial del inbox...
✅ [NOTIF] Inbox cargado: 15 notificaciones
🌊 [NOTIF] Intentando conexión SSE...
🌊 [NOTIF] Conectando a SSE: http://localhost:8000/api/me/notifications/stream?access_token=***
✅ [NOTIF] Conexión SSE establecida
```

**2. Network tab:**

- Filtrar por "stream"
- Verás una request con `Status: 200 (pending)` que **nunca termina**
- En la pestaña "EventStream" verás los eventos recibidos

**3. Logs del backend:**

```
[INFO] SSE connection opened for user 1
[INFO] Sending heartbeat
[INFO] New notification detected: 123
[INFO] Sent notification 123 to user 1
```

### **Si SSE Falla:**

```
❌ [NOTIF] Error en conexión SSE: [error details]
🔄 [NOTIF] Reintentando SSE en 1000ms (intento 1/5)...
🔄 [NOTIF] Reintentando SSE en 2000ms (intento 2/5)...
...
❌ [NOTIF] Máximo de reintentos alcanzado, cambiando a polling...
🔄 [NOTIF] Configurando polling cada 60 segundos...
```

---

## ⚡ Optimizaciones

### **1. Persistencia del Último ID**

Usamos `sessionStorage` para recordar el último ID recibido:

```typescript
const getLastEventId = (): number => {
	const stored = sessionStorage.getItem('notif_last_event_id');
	return stored ? parseInt(stored, 10) : 0;
};
```

**Beneficio:** Al reconectar, no pierdes notificaciones que llegaron mientras estabas desconectado.

```
T=0s    Conexión establecida, lastEventId = 100
T=30s   Red falla, conexión se pierde
T=31s   Backend recibe notificaciones 101, 102, 103
T=35s   Frontend reconecta con lastEventId = 100
T=36s   Backend envía historial: 101, 102, 103
T=37s   Frontend recibe las 3 notificaciones perdidas
```

---

### **2. Deduplicación en Frontend**

```typescript
const shownIdsRef = useRef<Set<number>>(new Set());

// Solo mostrar popup si es nueva
const newItems = items.filter((n) => !shownIdsRef.current.has(n.id));
newItems.forEach((n) => {
	shownIdsRef.current.add(n.id);
	showNativeNotification(n);
});
```

**Evita:**

- Mostrar popups duplicados al recargar página
- Spam de notificaciones si SSE envía la misma dos veces

---

### **3. Heartbeat para Mantener Conexión Viva**

```php
// Backend cada 0.5s
echo ": ping\n\n";
@ob_flush();
```

**Propósito:**

- Evita que proxies (Nginx, etc.) cierren la conexión por inactividad
- Permite detectar desconexiones rápidamente
- Los comentarios (`:`) no generan eventos en el cliente

---

## 🔒 Seguridad

### **1. Validación de Alcance**

El backend **siempre valida** que el usuario pueda ver cada notificación:

```php
// ¿Este usuario puede acceder a esta sucursal?
if (!$user->canAccessBranch($notification->event->branch_id)) {
    continue; // Saltar esta notificación
}
```

### **2. Rate Limiting**

Máximo 50 notificaciones por minuto por usuario+tipo:

```php
$key = "rate:{$userId}:{$typeId}";
if (Redis::get($key) >= 50) {
    return false; // No enviar más
}
Redis::incr($key);
Redis::expire($key, 60);
```

### **3. Deduplicación**

Evita notificaciones duplicadas en ventanas de 2 horas:

```php
$key = "dedup:{$typeKey}:{$entityId}:{$userId}";
if (Redis::exists($key)) {
    $existing->aggregate_count++;
    return false; // Ya existe
}
Redis::setex($key, 7200, '1');
```

---

## 📈 Comparativa de Rendimiento

### **Polling (Antes)**

```
Usuarios conectados: 100
Intervalo: 60 segundos
Requests por minuto: 100 usuarios × 1 request = 100 req/min
Requests por hora: 100 × 60 = 6,000 req/h
Requests por día: 100 × 60 × 24 = 144,000 req/day

Latencia promedio: 30 segundos (mitad del intervalo)
```

### **SSE (Ahora)**

```
Usuarios conectados: 100
Conexiones persistentes: 100 (una por usuario)
Requests por minuto: 0 (conexión ya abierta)
Requests por hora: 0
Requests por día: 0

Latencia promedio: < 1 segundo
```

**Ahorro:** **144,000 requests menos por día** para 100 usuarios.

---

## 🎯 Casos de Uso

### **SSE es Ideal Para:**

- ✅ Notificaciones de eventos del sistema
- ✅ Actualizaciones de estado en tiempo real
- ✅ Logs en vivo
- ✅ Dashboards con datos cambiantes
- ✅ Feeds de actividad

### **Polling es Mejor Para:**

- ⚠️ Datos que cambian muy poco
- ⚠️ Sistemas legacy sin soporte SSE
- ⚠️ Cuando no importa latencia de minutos

---

## 🔧 Configuración Recomendada

### **Desarrollo:**

```typescript
// Logs verbosos para debugging
console.log('🔔 [NOTIF] Conexión SSE establecida');
console.log('🔔 [NOTIF] Nueva notificación:', notification.id);
```

### **Producción:**

```typescript
// Solo logs de errores
if (process.env.NODE_ENV === 'development') {
	console.log('🔔 [NOTIF] Conexión SSE establecida');
}
```

### **Nginx:**

```nginx
location /api/me/notifications/stream {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_buffering off;           # CRÍTICO para SSE
    proxy_cache off;               # No cachear stream
    proxy_read_timeout 3600s;      # Timeout largo (1 hora)
}
```

---

## 🆘 Troubleshooting

### **Problema: SSE se desconecta cada 60 segundos**

**Causa:** Timeout configurado en el backend.

**Solución:**

```php
// StreamController.php
while (!connection_aborted() && (time() - $start) < 3600) { // 1 hora en vez de 60s
```

### **Problema: "Unauthorized" al conectar**

**Causa:** Token inválido o expirado.

**Solución:**

- Verificar que el token esté en `localStorage`
- Refrescar token antes de conectar SSE
- Implementar refresh automático de token

### **Problema: Notificaciones duplicadas**

**Causa:** `shownIdsRef` se resetea al cambiar de página.

**Solución:**

- Provider está en el nivel raíz (`App.tsx`)
- No se desmonta al navegar
- Solo se resetea al recargar página completa

---

## 📚 Referencias

- **MDN EventSource:** https://developer.mozilla.org/en-US/docs/Web/API/EventSource
- **HTML5 SSE Spec:** https://html.spec.whatwg.org/multipage/server-sent-events.html
- **Laravel Streaming:** https://laravel.com/docs/responses#streamed-responses

---

**Implementado por:** GitHub Copilot  
**Fecha:** 4 de noviembre de 2025  
**Versión:** 2.0 (SSE + Polling Fallback)
