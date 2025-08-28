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

        // Verificar token en localStorage y cargar personalización
        const token = localStorage.getItem('access_token');
        if (token) {
            console.log('✅ Token encontrado, cargando personalización...');
            dispatch(obtenerPersonalizacionThunk()).catch((error) => {
                console.warn('⚠️ Error cargando personalización inicial:', error);
            });
        } else if (!access) {
            console.log('🔒 No hay token válido, redirigiendo a login...');
            navigate('/login');
            return;
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

    // Cargar personalización cuando el usuario se autentica
    useEffect(() => {
        if (isAuthenticated && access && hasInitialized.current) {
            console.log('🔄 Usuario autenticado detectado, cargando personalización...');
            dispatch(obtenerPersonalizacionThunk()).catch((error) => {
                console.warn('⚠️ Error cargando personalización después de autenticación:', error);
            });
        }
    }, [isAuthenticated, access, dispatch]);

    return null; // Este componente no renderiza nada
};

export default AppInitializer;
