// Verificar estado de autenticación
// Pega este código en DevTools Console del navegador

console.log('=== DEBUG DE AUTENTICACIÓN ===');

// 1. Verificar token en localStorage
const token = localStorage.getItem('token');
console.log('1. Token en localStorage:', token ? 'Presente' : 'Ausente');
if (token) {
    try {
        const tokenParts = token.split('.');
        const payload = JSON.parse(atob(tokenParts[1]));
        console.log('   Token payload:', payload);
        console.log('   Token expira:', new Date(payload.exp * 1000));
        console.log('   Token válido:', payload.exp * 1000 > Date.now());
    } catch (e) {
        console.log('   Error parseando token:', e);
    }
}

// 2. Verificar estado Redux
if (window.__REDUX_DEVTOOLS_EXTENSION__) {
    const state = window.store?.getState();
    if (state?.auth) {
        console.log('2. Estado Redux auth:', state.auth);
        console.log('   Usuario:', state.auth.user);
        console.log('   Permisos:', state.auth.user?.permissions);
        console.log('   Roles:', state.auth.user?.roles);
    }
}

// 3. Verificar URL de API
console.log('3. URL de API:', import.meta.env?.VITE_API_URL || 'No definida');

// 4. Probar llamada a API
fetch('/api/user/me', {
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
})
.then(response => {
    console.log('4. Respuesta API /user/me:', response.status, response.statusText);
    return response.json();
})
.then(data => console.log('   Datos usuario:', data))
.catch(error => console.log('   Error API:', error));

console.log('=== FIN DEBUG ===');
