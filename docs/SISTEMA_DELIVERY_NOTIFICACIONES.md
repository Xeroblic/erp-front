# Sistema de Delivery de Notificaciones

## 🎯 Descripción

Sistema que gestiona la entrega de notificaciones mediante popups nativos de Windows, utilizando el atributo `delivered_to_user` en el backend para evitar duplicados.

## 📋 Flujo Completo

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Backend crea notificación → delivered_to_user = false       │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. SSE/Polling: Frontend recibe notificación en Redux store    │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. NotificationsStreamProvider detecta:                        │
│     items.filter(n => !n.delivered_to_user)                     │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. Muestra popup nativo de Windows (Notification API)          │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. POST /me/notifications/delivered { notification_ids: [ID] } │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. Backend marca: delivered_to_user = true                     │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  7. Redux actualiza item local: delivered_to_user = true        │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  8. En futuros polls/recargas: NO vuelve a mostrar popup        │
└─────────────────────────────────────────────────────────────────┘
```

## 🔑 Conceptos Clave

### `delivered_to_user` (Backend)

- **Tipo**: `boolean`
- **Valor por defecto**: `false`
- **Propósito**: Indica si la notificación ya fue mostrada al usuario mediante popup nativo
- **Ubicación**: Columna en tabla `user_notifications`

### Endpoints

#### POST `/me/notifications/delivered`

Marca una o más notificaciones como entregadas.

**Request:**

```json
{
	"notification_ids": [33, 42, 55]
}
```

**Response:**

```json
{
	"ok": true,
	"updated": 3
}
```

**Validaciones:**

- Requiere permiso: `deliver-own-notifications`
- Solo puede marcar notificaciones propias (user_id del usuario autenticado)
- Si intenta marcar notificaciones de otro usuario → **403 Forbidden**

#### POST `/me/notifications/delivered-all`

Marca TODAS las notificaciones del usuario como entregadas.

**Request:**

```json
{}
```

**Response:**

```json
{
	"ok": true,
	"updated": 15
}
```

**Validaciones:**

- Requiere permiso: `deliver-all-own-notifications`

## 🎨 Frontend: Implementación

### 1. Interface TypeScript

```typescript
// src/interface/notifications.interface.ts
export interface UserNotificationDTO {
	id: number;
	status: NotificationStatus;
	bucket?: NotificationBucket;
	// ... otros campos
	delivered_to_user?: boolean; // ← NUEVO CAMPO
	message?: string | null;
}
```

### 2. Redux Thunks

```typescript
// src/store/slices/notifications/notificationsSlice.ts

// Marcar notificaciones específicas como entregadas
export const markDelivered = createAsyncThunk<
	{ ids: number[] },
	{ ids: number[] },
	{ rejectValue: string }
>('notifications/markDelivered', async ({ ids }, { rejectWithValue }) => {
	try {
		await ApiService.fetchData({
			url: '/me/notifications/delivered',
			method: 'post',
			data: { notification_ids: ids },
		});
		return { ids };
	} catch (e: any) {
		return rejectWithValue(e?.response?.data?.message ?? 'Error');
	}
});

// Marcar TODAS como entregadas
export const markAllDelivered = createAsyncThunk<void, void>(
	'notifications/markAllDelivered',
	async () => {
		await ApiService.fetchData({
			url: '/me/notifications/delivered-all',
			method: 'post',
		});
	},
);
```

### 3. NotificationsStreamProvider

```typescript
// src/notifications/NotificationsStreamProvider.tsx
const NotificationsStreamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { items } = useAppSelector((state) => state.notifications ?? { items: [] });
  const processingRef = useRef<Set<number>>(new Set());

  // Detectar notificaciones NO entregadas
  useEffect(() => {
    if (!Array.isArray(items)) return;

    // Filtrar: solo delivered_to_user = false
    const newItems = items.filter(
      (n) => !n.delivered_to_user && !processingRef.current.has(n.id)
    );

    if (newItems.length === 0) return;

    console.log('🆕 [NOTIF] Notificaciones NO ENTREGADAS:', newItems.length);

    newItems.forEach((n) => {
      // Marcar como en proceso
      processingRef.current.add(n.id);

      // 1. Mostrar popup
      showNativeNotification(n);

      // 2. Marcar en backend
      dispatch(markDelivered({ ids: [n.id] }))
        .unwrap()
        .then(() => {
          console.log('✅ Marcada como entregada:', n.id);
        })
        .catch((err) => {
          console.error('❌ Error marcando:', n.id, err);
        })
        .finally(() => {
          processingRef.current.delete(n.id);
        });
    });
  }, [items, dispatch]);

  return <>{children}</>;
};
```

## 🔒 Permisos Requeridos

### Backend (Laravel - Spatie)

```php
// config/permissions.php
'notification' => [
    'deliver-own-notifications',      // Marcar específicas como delivered
    'deliver-all-own-notifications',  // Marcar todas como delivered
],
```

### Seeds

```php
// database/seeders/PermissionSeeder.php
Permission::create(['name' => 'deliver-own-notifications', 'guard_name' => 'api']);
Permission::create(['name' => 'deliver-all-own-notifications', 'guard_name' => 'api']);
```

### Asignación a Roles

```php
// Todos los usuarios autenticados deberían tener este permiso
$userRole->givePermissionTo([
    'deliver-own-notifications',
    'deliver-all-own-notifications',
]);
```

## 🧪 Testing

### Flujo de Prueba Manual

1. **Crear notificación en backend:**

    ```php
    // Ejecutar desde Tinker o seeder
    $event = NotificationEvent::create([...]);
    // El NotificationRouter creará UserNotification con delivered_to_user = false
    ```

2. **Verificar en frontend:**
    - Abrir DevTools → Console
    - Deberías ver: `🆕 [NOTIF] Notificaciones NO ENTREGADAS: 1`
    - Debe aparecer popup nativo de Windows
    - Luego ver: `✅ Marcada como entregada: {ID}`

3. **Recargar página:**
    - NO debe volver a mostrar el popup
    - En logs: `🆕 [NOTIF] Notificaciones NO ENTREGADAS: 0`

4. **Verificar en backend:**
    ```sql
    SELECT id, delivered_to_user FROM user_notifications WHERE id = {ID};
    -- Debe ser: delivered_to_user = 1 (true)
    ```

### Tests Automatizados

```php
// tests/Feature/Notifications/DeliverNotificationsTest.php
public function test_user_can_mark_single_notification_as_delivered(): void
{
    [$user, $token] = $this->makeUserWithToken();
    $notification = $this->makeNotificationForUser($user);

    $response = $this->withHeader('Authorization', 'Bearer '.$token)
        ->postJson('/api/me/notifications/delivered', [
            'notification_id' => $notification->id,
        ]);

    $response->assertStatus(200)
        ->assertJson(['ok' => true, 'updated' => 1]);

    $this->assertTrue($notification->fresh()->delivered_to_user);
}

public function test_cannot_mark_notification_from_other_user(): void
{
    [$user, $token] = $this->makeUserWithToken();
    [$otherUser] = $this->makeUserWithToken('other@example.test');
    $otherNotification = $this->makeNotificationForUser($otherUser);

    $response = $this->withHeader('Authorization', 'Bearer '.$token)
        ->postJson('/api/me/notifications/delivered', [
            'notification_id' => $otherNotification->id,
        ]);

    $response->assertStatus(403);
    $this->assertFalse($otherNotification->fresh()->delivered_to_user);
}
```

## 🐛 Debugging

### Frontend

```javascript
// En DevTools Console:

// Ver estado actual del store
window.$store.getState().notifications.items.map((n) => ({
	id: n.id,
	delivered: n.delivered_to_user,
	message: n.message,
}));

// Marcar todas como NO entregadas (solo para testing)
// NOTA: Esto requeriría un endpoint adicional o manipulación manual de BD
```

### Backend

```php
// Tinker
$user = User::find(1);

// Ver notificaciones no entregadas
UserNotification::where('user_id', $user->id)
    ->where('delivered_to_user', false)
    ->get(['id', 'delivered_to_user', 'created_at']);

// Resetear delivery (para testing)
UserNotification::where('user_id', $user->id)
    ->update(['delivered_to_user' => false]);
```

## ⚠️ Diferencias con Sistema Anterior

| Aspecto                 | Sistema Anterior (localStorage) | Sistema Actual (delivered_to_user)       |
| ----------------------- | ------------------------------- | ---------------------------------------- |
| **Almacenamiento**      | localStorage del navegador      | Base de datos (columna en tabla)         |
| **Sincronización**      | Solo en un navegador            | Entre todos los dispositivos del usuario |
| **Límite**              | ~100 IDs (limitación frontend)  | Ilimitado                                |
| **Persistencia**        | Puede perderse al limpiar cache | Persiste siempre en BD                   |
| **Seguridad**           | Manipulable por el usuario      | Protegido por backend + permisos         |
| **Multi-dispositivo**   | ❌ No funciona                  | ✅ Funciona perfectamente                |
| **Recarga de página**   | ✅ Funciona                     | ✅ Funciona                              |
| **Cambio de navegador** | ❌ Se pierde                    | ✅ Se mantiene                           |

## 🚀 Ventajas del Nuevo Sistema

1. **Multi-dispositivo**: Usuario autenticado en PC y móvil → solo ve popup una vez en total
2. **Persistencia real**: Datos en BD, no depende de localStorage
3. **Auditoría**: Puedes saber qué notificaciones fueron entregadas y cuándo
4. **Seguridad**: Backend valida que solo puedas marcar tus propias notificaciones
5. **Escalabilidad**: No hay límite de 100 IDs como en localStorage
6. **Debugging**: Fácil ver estado desde BD o logs

## 📚 Referencias

- **Interface**: `src/interface/notifications.interface.ts`
- **Redux Slice**: `src/store/slices/notifications/notificationsSlice.ts`
- **Provider**: `src/notifications/NotificationsStreamProvider.tsx`
- **Backend Controller**: `app/Http/Controllers/Notifications/NotificationController.php`
- **Backend Model**: `app/Models/Notifications/UserNotification.php`
- **Backend Request**: `app/Http/Requests/Notifications/DeliverNotificationsRequest.php`
- **Tests**: `tests/Feature/Notifications/DeliverNotificationsTest.php`
- **Permisos**: `config/permissions.php`

---

**Implementado por:** GitHub Copilot  
**Fecha:** 4 de noviembre de 2025  
**Versión:** 4.0 (Backend-Driven Delivery System)
