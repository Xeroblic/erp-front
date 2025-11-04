# 🔧 Guía de Diagnóstico: Notificaciones Nativas de Windows

## 🎯 Problema Identificado

**El código tenía una línea que bloqueaba TODAS las notificaciones cuando la ventana estaba visible:**

```typescript
// ❌ LÍNEA PROBLEMÁTICA (YA ELIMINADA)
if (document.visibilityState === 'visible') return;
```

Esta línea hacía que:

- ✅ Solo mostrara notificaciones si la ventana estaba minimizada o en otra pestaña
- ❌ **NUNCA** mostrara notificaciones si estabas viendo la página

## ✅ Solución Implementada

1. **Eliminé la condición problemática** - Ahora muestra notificaciones siempre
2. **Agregué logs detallados** - Para diagnosticar cualquier otro problema
3. **Mejoré el manejo de permisos** - Con feedback claro

---

## 🔍 Pasos de Diagnóstico

### **Paso 1: Abre la Consola del Navegador**

1. Presiona `F12` o `Ctrl+Shift+I`
2. Ve a la pestaña **Console**
3. Filtra por `[NOTIF]` para ver solo logs de notificaciones

### **Paso 2: Revisa los Logs de Inicio**

Cuando la página carga, deberías ver:

```
🔔 [NOTIF] ========== SISTEMA DE NOTIFICACIONES INICIADO ==========
🔔 [NOTIF] Verificando soporte del navegador...
✅ [NOTIF] Notification API soportada
🔔 [NOTIF] Permiso actual: granted    ← DEBE decir "granted"
✅ [NOTIF] Permiso ya otorgado previamente.
```

#### ⚠️ Si dice `default` o `denied`:

**PROBLEMA: No tienes permisos otorgados**

**Solución:**

1. Click en el **candado** 🔒 a la izquierda de la URL
2. Busca "Notificaciones"
3. Cambia a **"Permitir"**
4. Recarga la página (`F5`)

---

### **Paso 3: Revisa el Polling**

Cada 60 segundos verás:

```
🔄 [NOTIF] [10:30:45 AM] Ejecutando polling de notificaciones...
✅ [NOTIF] [10:30:45 AM] Polling exitoso: 15 notificaciones
📊 [NOTIF] IDs recibidos: 1, 2, 3, 4, 5, ...
```

#### ⚠️ Si NO ves estos logs:

**PROBLEMA: El polling no está funcionando**

Posibles causas:

- Backend caído
- Error de autenticación
- CORS bloqueado

Busca errores en rojo en la consola.

---

### **Paso 4: Detectar Nuevas Notificaciones**

Cuando hay notificaciones nuevas:

```
📊 [NOTIF] ========== PROCESANDO NOTIFICACIONES ==========
📊 [NOTIF] Total en store: 15
📊 [NOTIF] IDs en store: 1, 2, 3, 4, 5, ...
📊 [NOTIF] IDs ya mostrados: 1, 2, 3, 4
🆕 [NOTIF] Notificaciones NUEVAS detectadas: 1
🆕 [NOTIF] Detalle de nuevas:
  1. ID: 5 | Tipo: product.created | Mensaje: Producto creado: Notebook X390
```

#### ⚠️ Si siempre dice "0" nuevas:

**PROBLEMA: Todas las notificaciones ya fueron mostradas**

**Solución para probar:**

1. Abre la consola
2. Ejecuta: `sessionStorage.clear(); location.reload();`
3. Esto resetea el historial de IDs mostrados

---

### **Paso 5: Mostrar Notificación Nativa**

Cuando intenta mostrar:

```
🔔 [NOTIF] ========== INTENTANDO MOSTRAR NOTIFICACIÓN NATIVA ==========
🔔 [NOTIF] ID: 5
🔔 [NOTIF] Mensaje: Producto creado: Notebook X390
🔔 [NOTIF] Tipo: product.created
🔔 [NOTIF] API soportada: true
🔔 [NOTIF] Permiso actual: granted    ← DEBE decir "granted"
✅ [NOTIF] Todos los checks pasados, creando notificación...
🔔 [NOTIF] Título: Producto creado
🔔 [NOTIF] Cuerpo: Producto creado: Notebook X390
✅ [NOTIF] ¡Notificación creada! Debería aparecer en Windows ahora.
✅ [NOTIF] Notificación MOSTRADA exitosamente ID 5    ← Confirmación
```

#### ✅ Si ves este último log:

**¡La notificación SE MOSTRÓ en Windows!**

Busca el popup en la esquina inferior derecha de tu pantalla.

#### ⚠️ Si ves errores:

```
❌ [NOTIF] Permiso NO otorgado. Estado: denied
❌ [NOTIF] El usuario debe ir a configuración del navegador y habilitar notificaciones
```

**SOLUCIÓN:**

Ve al navegador y habilita permisos (ver Paso 2).

---

## 🧪 Cómo Probar Manualmente

### **Opción A: Crear una Notificación de Prueba desde Consola**

1. Abre la consola (`F12`)
2. Pega este código:

```javascript
// Verificar permiso
console.log('Permiso actual:', Notification.permission);

// Si no está granted, solicitar
if (Notification.permission !== 'granted') {
	Notification.requestPermission().then((permission) => {
		console.log('Nuevo permiso:', permission);
	});
}

// Crear notificación de prueba
new Notification('🧪 Prueba Manual', {
	body: 'Si ves esto, las notificaciones funcionan!',
	icon: '/logo192.png',
	requireInteraction: true,
});
```

3. Deberías ver un popup de Windows

### **Opción B: Forzar Refrescar Notificaciones**

```javascript
// En la consola
window.dispatchEvent(new Event('focus'));
```

Esto dispara el evento de "ventana enfocada" y refresca notificaciones.

---

## 🐛 Problemas Comunes

### 1. **"Permiso denegado previamente"**

**Causa:** Rechazaste el permiso antes

**Solución:**

1. Chrome: `chrome://settings/content/notifications`
2. Busca tu URL
3. Cambia a "Permitir"
4. Recarga la página

### 2. **"No hay notificaciones nuevas"**

**Causa:** Ya mostraste todas las notificaciones en esta sesión

**Solución:**

- Resetea con `sessionStorage.clear(); location.reload();`
- O espera a que el backend genere una notificación nueva

### 3. **"Notificación creada pero no aparece"**

**Causas posibles:**

- Windows tiene notificaciones deshabilitadas globalmente
- Modo "No molestar" activado
- El navegador está en modo silencioso

**Solución:**

1. Windows 11: `Configuración > Sistema > Notificaciones`
2. Verifica que "Notificaciones" esté encendido
3. Verifica que Chrome tenga permisos

### 4. **"Notification API NO soportada"**

**Causa:** Navegador muy viejo o entorno sin soporte

**Solución:**

- Actualiza el navegador
- Las notificaciones nativas requieren Chrome 22+, Firefox 22+, Edge 14+

---

## 📊 Checklist de Verificación

Marca cada item:

- [ ] Consola muestra "Sistema de notificaciones iniciado"
- [ ] Permiso es `granted` (no `default` ni `denied`)
- [ ] Polling se ejecuta cada 60 segundos
- [ ] Se detectan notificaciones nuevas
- [ ] Log dice "Notificación creada"
- [ ] Log dice "Notificación MOSTRADA exitosamente"
- [ ] Popup aparece en Windows

Si todos están marcados, **¡el sistema funciona!** 🎉

---

## 🔄 Cambios Realizados en el Código

### Eliminado:

```typescript
// ❌ Esta línea bloqueaba notificaciones si la ventana estaba visible
if (document.visibilityState === 'visible') return;
```

### Agregado:

- ✅ Logs detallados en cada paso
- ✅ Manejo de errores con eventos (`onshow`, `onerror`, `onclose`)
- ✅ Verificación explícita de permisos con feedback
- ✅ Timestamp en logs de polling

---

## 🎯 Próximos Pasos

1. **Abre la aplicación**
2. **Abre la consola (F12)**
3. **Busca los logs `[NOTIF]`**
4. **Sigue este documento paso a paso**
5. **Reporta qué ves en la consola**

Con estos logs, podremos identificar exactamente dónde está el problema.

---

## 🆘 Si Sigue Sin Funcionar

Copia TODO el output de la consola que contenga `[NOTIF]` y compártelo.

Ejemplo:

```
🔔 [NOTIF] ========== SISTEMA DE NOTIFICACIONES INICIADO ==========
🔔 [NOTIF] Verificando soporte del navegador...
✅ [NOTIF] Notification API soportada
🔔 [NOTIF] Permiso actual: denied    ← AQUÍ ESTÁ EL PROBLEMA
...
```

Con esa información podré ayudarte específicamente.
