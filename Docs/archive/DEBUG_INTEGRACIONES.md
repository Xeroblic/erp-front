# Debug: Módulo de Integraciones

## ✅ Checklist de Verificación

### 1. Verificar Permisos del Usuario

Abre Redux DevTools y verifica:

```javascript
// Estado de autenticación
state.auth.user.roles; // Debe incluir 'super-admin'
state.auth.user.authority; // Debe incluir 'view-user' o ser super-admin
state.auth.permisos; // Array de permisos del usuario
```

**Solución si falta el rol:**

- Asigna el rol `super-admin` al usuario desde el backend
- O modifica `pages.config.ts` línea 476: cambia `roles: ['super-admin']` a los roles que necesites

### 2. Verificar subsidiaryId

```javascript
state.auth.user.subsidiary.id; // Debe existir y ser un número
// O alternativas:
state.auth.user.personalizacion.subsidiary_id;
state.auth.user.branch.subsidiary.id;
```

**Solución si falta:**

- El backend debe asignar una subsidiaria al usuario
- O las páginas mostrarán un mensaje de debug con tu estructura de usuario

### 3. Verificar Compilación

```cmd
npm run build
```

Debe completar sin errores TypeScript. ✅ **ESTO YA ESTÁ FUNCIONANDO**

### 4. Verificar Navegación en Sidebar

En `DefaultAside.template.tsx` líneas 564-623:

```tsx
<AuthorityCheckNav
	authority={[
		...(Pages.integrations.authority || []),
		...(Pages.integrations.roles || []),
	]}
	userAuthority={userPermissionsAndRoles}
	requireAll={Pages.integrations.requireAll}>
```

**Esto verifica:**

- Authority: `['view-user']`
- Roles: `['super-admin']`
- RequireAll: `true` (debe cumplir AMBOS)

**Solución si no aparece:**

- Cambiar `requireAll: false` en `pages.config.ts` línea 476
- O asegurar que el usuario tenga ambos: permiso `view-user` Y rol `super-admin`

### 5. Verificar Rutas

En consola del navegador:

- No debe haber errores 404
- No debe haber errores de importación de módulos
- React Router debe cargar las páginas

**URLs válidas:**

- `/integraciones/lista`
- `/integraciones/productos-sin-mapear`
- `/integraciones/sincronizar-stock`
- `/integraciones/importar-ordenes`

### 6. Verificar Backend

Prueba los endpoints directamente:

```bash
# Listar integraciones
GET /api/subsidiaries/{subsidiaryId}/integrations

# Debería retornar 200 con array de integraciones (puede estar vacío)
```

## 🔧 Soluciones Rápidas

### Problema: No veo "Integraciones" en el sidebar

**Causa:** Falta permiso o rol

**Solución temporal** (para testing):

En `pages.config.ts` línea 470-478, cambia:

```typescript
integrations: {
	id: 'integrations',
	to: '/integraciones',
	text: 'Integraciones',
	icon: 'HeroGlobeAlt',
	authority: [], // <-- CAMBIA ESTO temporalmente
	roles: [], // <-- CAMBIA ESTO temporalmente
	requireAll: false, // <-- CAMBIA ESTO
```

**⚠️ ADVERTENCIA:** Esto permite acceso a TODOS los usuarios. Solo para pruebas.

### Problema: "No se encuentra el módulo" al compilar

**Solución:**

```cmd
# Limpia caché de TypeScript
del /s /q node_modules\.cache
npm run build
```

### Problema: Página carga pero no muestra datos

**Causa:** subsidiaryId no existe o backend no responde

**Solución:**

1. Verifica Redux DevTools: `state.auth.user.subsidiary.id`
2. Si es `undefined`, el backend debe asignar subsidiaria al usuario
3. Si existe pero no hay datos, crea una integración desde el modal

### Problema: Error 404 en las páginas

**Causa:** Las rutas lazy() no se están cargando

**Solución:**

```typescript
// En contentRoutes.tsx, cambia de lazy a import directo:
import IntegrationsListPage from '@/pages/integraciones/IntegrationsListPage';
// ... resto de imports

// Y luego usa directamente sin lazy():
{
	path: cfg.integrations.subPages.list.to,
	element: <IntegrationsListPage />,
	authority: cfg.integrations.subPages.list.authority,
}
```

## 📋 Checklist Final

Marca cada ítem cuando lo verifiques:

- [ ] Usuario tiene rol `super-admin`
- [ ] Usuario tiene permiso `view-user` (o es super-admin)
- [ ] Usuario tiene `subsidiaryId` asignado
- [ ] Backend está corriendo
- [ ] `npm run dev` ejecuta sin errores
- [ ] Veo "Integraciones" en el sidebar
- [ ] Puedo expandir el menú y ver las 4 opciones
- [ ] Al hacer click en "Listado" carga la página
- [ ] La página muestra tabla (aunque esté vacía)
- [ ] Redux DevTools muestra slice `integrations` y `unmappedProducts`

## 🎯 Próximos Pasos

Una vez que veas el módulo funcionando:

1. **Crear primera integración:**
    - Click "Nueva Integración"
    - Llenar formulario WooCommerce
    - **IMPORTANTE:** Copiar las claves que se muestran (solo se ven una vez)

2. **Probar endpoints:**
    - Ver productos sin mapear
    - Sincronizar stock
    - Importar órdenes

3. **Configurar webhooks en WooCommerce:**
    - URL: `{tu_erp_url}/api/integrations/woocommerce/webhooks/{api_key}/orders`
    - Secret: El `webhook_secret` que copiaste
    - Eventos: Order created, Order updated

## 📞 Necesitas Ayuda?

Si sigues sin verlo funcionar, comparte:

1. Screenshot de Redux DevTools: `state.auth.user`
2. Errores de consola del navegador (F12)
3. Errores de terminal donde corre `npm run dev`
4. Screenshot del sidebar mostrando qué menús ves

---

**Última actualización:** 13 de noviembre de 2025
**Status:** ✅ Módulo completamente implementado y compilando sin errores

62e6b14601356d6f92265ee5fe5a1aeb2f57d4527b3068486bc9e8d99fc0ddbd

997a3aef55e34a9ee9e9fb00e011cf3d3705b325441c002f21e6cf7431cf275f
