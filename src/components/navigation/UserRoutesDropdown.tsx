import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../store';
import SelectReact, { TSelectOption } from '../form/SelectReact';
import Icon from '../icon/Icon';
import { privatePages, PageConfig } from '../../config/pages.config';

interface UserRoutesDropdownProps {
    className?: string;
}

interface RouteOption {
    value: string;
    label: string;
    icon: string;
    category: string;
}

const UserRoutesDropdown: React.FC<UserRoutesDropdownProps> = ({ className = '' }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const user = useAppSelector((state) => state.auth.user);

    const [isOpen, setIsOpen] = useState(false);

    // Funciones de verificación de permisos y roles
    const hasRole = (role: string): boolean => {
        return user?.position === role || (user?.authority?.includes('super-admin') && role !== 'super-admin') || false;
    };

    const hasAnyPermission = (permissions: string[]): boolean => {
        if (!user?.authority) return false;
        return permissions.some(permission => user.authority.includes(permission));
    };

    const hasAllPermissions = (permissions: string[]): boolean => {
        if (!user?.authority) return false;
        return permissions.every(permission => user.authority.includes(permission));
    };

    // Función para verificar si el usuario tiene acceso a una página
    const hasPageAccess = (page: PageConfig): boolean => {
        // Verificar roles si están definidos
        if (page.roles && page.roles.length > 0) {
            if (!page.roles.some(role => hasRole(role))) {
                return false;
            }
        }

        // Verificar permisos si están definidos
        if (page.authority && page.authority.length > 0) {
            if (page.requireAll) {
                return hasAllPermissions(page.authority);
            } else {
                return hasAnyPermission(page.authority);
            }
        }

        return true;
    };

    // Función recursiva para obtener todas las páginas disponibles
    const getAllAvailablePages = (pages: any, category: string = 'Principal'): RouteOption[] => {
        const routes: RouteOption[] = [];

        Object.entries(pages).forEach(([_, page]: [string, any]) => {
            // Si la página tiene subPages, procesarlas recursivamente
            if (page.subPages) {
                // Agregar la página padre si tiene acceso
                if (hasPageAccess(page)) {
                    routes.push({
                        value: page.to,
                        label: page.text,
                        icon: page.icon,
                        category: category
                    });
                }

                // Procesar subpáginas
                const subRoutes = getAllAvailablePages(page.subPages, page.text);
                routes.push(...subRoutes);
            } else {
                // Es una página simple, verificar acceso
                if (hasPageAccess(page)) {
                    routes.push({
                        value: page.to,
                        label: page.text,
                        icon: page.icon,
                        category: category
                    });
                }
            }
        });

        return routes;
    };

    // Obtener todas las rutas disponibles para el usuario
    const availableRoutes = useMemo(() => {
        return getAllAvailablePages(privatePages);
    }, [user, hasAnyPermission, hasAllPermissions, hasRole]);

    // Convertir a opciones de select
    const routeOptions: TSelectOption[] = useMemo(() => {
        return availableRoutes.map(route => ({
            value: route.value,
            label: `${route.category} → ${route.label}`
        }));
    }, [availableRoutes]);

    // Obtener la ruta actual
    const currentRoute = useMemo(() => {
        return routeOptions.find(option => option.value === location.pathname) || null;
    }, [routeOptions, location.pathname]);

    // Manejar navegación
    const handleRouteChange = (newValue: any) => {
        const option = newValue as TSelectOption;
        if (option && option.value !== location.pathname) {
            navigate(option.value);
        }
    };

    if (routeOptions.length === 0) {
        return null;
    }

    return (
        <div className={`relative ${className}`}>
            <div className="flex items-center gap-2 text-sm text-gray-600">
                <Icon icon="HeroMapPin" className="w-4 h-4" />
                <span className="hidden md:inline">Ir a:</span>
            </div>

            <div className="min-w-[250px]">
                <SelectReact
                    name="user-routes"
                    options={routeOptions}
                    value={currentRoute}
                    onChange={handleRouteChange}
                    placeholder="Seleccionar página..."
                    isSearchable={true}
                    isClearable={false}
                    menuPortalTarget={document.body}
                    styles={{
                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                        control: (base) => ({
                            ...base,
                            minHeight: '36px',
                            fontSize: '14px'
                        }),
                        menu: (base) => ({
                            ...base,
                            fontSize: '14px'
                        })
                    }}
                />
            </div>

            {/* Información adicional para debugging */}
            {process.env.NODE_ENV === 'development' && (
                <div className="mt-2 text-xs text-gray-500">
                    <div>Rutas disponibles: {availableRoutes.length}</div>
                    <div>Rol actual: {user?.position || 'N/A'}</div>
                    <div>Empresa: {user?.company?.name || 'N/A'}</div>
                </div>
            )}
        </div>
    );
};

export default UserRoutesDropdown;
