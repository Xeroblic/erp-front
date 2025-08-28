import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { validateSession } from '../store/slices/auth/authSlice';
import { obtenerPersonalizacionThunk } from '../store/slices/personalizacion/personalizacionSlice';

const AppInitializer = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, access } = useAppSelector((state) => state.auth);
    const hasInitialized = useRef(false);

    useEffect(() => {
        // Solo inicializar una vez
        if (hasInitialized.current) return;
        hasInitialized.current = true;

        // No validar en rutas públicas
        const publicRoutes = ['/login', '/recuperar-password', '/registro'];
        if (publicRoutes.includes(location.pathname)) {
            return;
        }

        // Validar sesión al inicio
        dispatch(validateSession());

        // Verificar token en localStorage
        const token = localStorage.getItem('access_token');
        if (!token && !access) {
            console.log('🔒 No hay token válido, redirigiendo a login...');
            navigate('/login');
            return;
        }

        // Si hay token y está autenticado, cargar personalización
        if (isAuthenticated && access) {
            console.log('✅ Usuario autenticado, cargando personalización...');
            dispatch(obtenerPersonalizacionThunk());
        }
    }, []); // Solo ejecutar una vez

    // Escuchar cambios en la autenticación para redireccionar (solo si ya se inicializó)
    useEffect(() => {
        if (!hasInitialized.current) return;

        const publicRoutes = ['/login', '/recuperar-password', '/registro'];
        if (publicRoutes.includes(location.pathname)) {
            return;
        }

        if (!isAuthenticated && !access) {
            console.log('🔒 Sesión no válida, redirigiendo a login...');
            // Usar window.location para forzar recarga completa
            window.location.href = '/login';
        }
    }, [isAuthenticated, access, location.pathname]);

    return null; // Este componente no renderiza nada
};

export default AppInitializer;
