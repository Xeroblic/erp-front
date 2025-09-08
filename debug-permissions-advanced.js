// Script de depuración mejorado para verificar permisos del usuario
// Para ejecutar en DevTools del navegador

console.log('=== 🔍 DEBUG AVANZADO: Estado de Permisos ===');

// Función para obtener el estado del store
function getStoreState() {
    // Intentar acceder al store de diferentes maneras
    if (window.__REDUX_DEVTOOLS_EXTENSION__) {
        return window.__REDUX_DEVTOOLS_EXTENSION__.store.getState();
    }
    
    if (window.store) {
        return window.store.getState();
    }
    
    // Si no podemos acceder directamente, buscar en el DOM
    const reactRoot = document.querySelector('#root')._reactInternalInstance || 
                     document.querySelector('#root').__reactContainer;
    
    console.log('⚠️ No se pudo acceder al store directamente');
    return null;
}

const state = getStoreState();

if (!state) {
    console.log('❌ No se pudo acceder al estado de Redux');
    console.log('📋 Para debuggear manualmente:');
    console.log('1. Abre las Redux DevTools');
    console.log('2. Ve a la pestaña "State"');
    console.log('3. Busca la sección "auth"');
    return;
}

console.log('🎯 Estado de Redux obtenido exitosamente');

// Información del usuario
const authState = state.auth;
console.log('👤 Usuario completo:', authState.user);
console.log('🔐 Permisos del store:', authState.permisos);
console.log('🎭 Authority del usuario:', authState.user?.authority);
console.log('🏛️ Roles globales:', authState.user?.global_roles);
console.log('🆔 Es autenticado:', authState.isAuthenticated);
console.log('🔑 Tiene token:', !!authState.access);

// Información de la empresa
if (authState.user?.companies) {
    console.log('🏢 Empresas del usuario:', authState.user.companies);
} else {
    console.log('⚠️ No se encontraron empresas en el usuario');
}

// Verificar permisos específicos para usuarios
const requiredPermissions = ['view-user', 'manage-company-users'];
const requiredRoles = ['super-admin', 'company-admin', 'subsidiary-admin'];

console.log('🧪 Prueba de permisos para página de usuarios:');
console.log('  📋 Permisos requeridos:', requiredPermissions);
console.log('  🎭 Roles requeridos:', requiredRoles);

// Verificar permisos
const userAuthority = authState.permisos || [];
const hasRequiredPermission = requiredPermissions.some(p => userAuthority.includes(p));
const hasRequiredRole = requiredRoles.some(r => userAuthority.includes(r));
const isSuperAdmin = userAuthority.includes('super-admin') || authState.user?.authority?.includes('super-admin');

console.log('✅ Resultados de verificación:');
console.log('  🔐 Tiene permisos requeridos:', hasRequiredPermission);
console.log('  🎭 Tiene roles requeridos:', hasRequiredRole);
console.log('  👑 Es super admin:', isSuperAdmin);
console.log('  ✔️ Debería tener acceso:', isSuperAdmin || hasRequiredPermission || hasRequiredRole);

// Información del token
if (authState.access) {
    try {
        const tokenParts = authState.access.split('.');
        if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            console.log('🔑 Información del token:');
            console.log('  📅 Expira:', new Date(payload.exp * 1000));
            console.log('  👤 Usuario ID:', payload.user_id);
            console.log('  ⏰ Válido hasta:', payload.exp > Date.now() / 1000 ? 'Válido' : 'Expirado');
        }
    } catch (e) {
        console.log('⚠️ No se pudo decodificar el token:', e.message);
    }
} else {
    console.log('❌ No hay token en el estado');
}

// Verificar localStorage
const localToken = localStorage.getItem('access_token');
console.log('💾 Token en localStorage:', localToken ? 'Existe' : 'No existe');

if (localToken && localToken !== authState.access) {
    console.log('⚠️ PROBLEMA: Token en localStorage diferente al del store');
}

// Información de navegación actual
console.log('🧭 Información de navegación:');
console.log('  📍 URL actual:', window.location.href);
console.log('  🛤️ Pathname:', window.location.pathname);

console.log('=== 🏁 FIN DEBUG AVANZADO ===');
