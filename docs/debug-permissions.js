// Script de depuración para verificar permisos del usuario
// Ejecutar esto en las DevTools del navegador para verificar el estado

console.log('=== DEBUG: Estado de Permisos ===');

// Acceder al store de Redux
const store = window.__REDUX_DEVTOOLS_EXTENSION__ || window.store;
if (store) {
    const state = store.getState();
    
    console.log('🔍 Estado de autenticación:', state.auth);
    console.log('👤 Usuario:', state.auth.user);
    console.log('🔐 Permisos en store:', state.auth.permisos);
    console.log('🎭 Authority del usuario:', state.auth.user?.authority);
    console.log('🏛️ Roles globales:', state.auth.user?.global_roles);
    console.log('🆔 Es super admin:', state.auth.user?.authority?.includes('super-admin'));
    console.log('📊 Company ID:', state.auth.user?.company?.id);
    
    // Verificar el estado del localStorage
    console.log('💾 Token en localStorage:', localStorage.getItem('access_token') ? 'Existe' : 'No existe');
    
    // Verificar si el hook useAuthority funcionaría
    const userAuthority = state.auth.permisos || [];
    const requiredPermissions = ['view-user', 'manage-company-users'];
    const requiredRoles = ['super-admin', 'company-admin', 'subsidiary-admin'];
    
    console.log('🧪 Prueba de permisos:');
    console.log('  - Permisos del usuario:', userAuthority);
    console.log('  - Permisos requeridos:', requiredPermissions);
    console.log('  - Roles requeridos:', requiredRoles);
    
    const hasPermission = requiredPermissions.some(p => userAuthority.includes(p));
    const hasRole = requiredRoles.some(r => userAuthority.includes(r));
    const isSuperAdmin = userAuthority.includes('super-admin');
    
    console.log('  - Tiene permisos requeridos:', hasPermission);
    console.log('  - Tiene roles requeridos:', hasRole);
    console.log('  - Es super admin:', isSuperAdmin);
    console.log('  - Resultado final:', isSuperAdmin || hasPermission || hasRole);
} else {
    console.log('❌ No se pudo acceder al store de Redux');
}

console.log('=== FIN DEBUG ===');
