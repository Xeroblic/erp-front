-- =====================================================
-- SEED DE PERMISOS PARA SISTEMA ERP
-- =====================================================
-- Generado automáticamente basado en la estructura del frontend
-- Fecha: $(date '+%Y-%m-%d %H:%M:%S')

-- Limpiar datos existentes (opcional)
-- DELETE FROM role_permissions;
-- DELETE FROM permissions;
-- DELETE FROM roles;

-- =====================================================
-- 1. ROLES DEL SISTEMA (13 roles empresariales)
-- =====================================================
INSERT INTO roles (name, code, level, description, is_active, created_at) VALUES 
-- Roles directivos y administrativos
('Super Administrador', 'super-admin', 0, 'Control total del sistema, acceso a todas las funcionalidades', true, NOW()),
('Supervisor de Empresa', 'supervisor-empresa', 1, 'Supervisión general de la empresa, acceso a reportes ejecutivos', true, NOW()),
('Administrador', 'administrador', 2, 'Administración operativa, gestión de usuarios y configuraciones', true, NOW()),
('Gestor Operativo', 'gestor-operativo', 3, 'Gestión de operaciones diarias, coordinación de procesos', true, NOW()),
('Coordinador Logístico', 'coordinador-logistico', 4, 'Coordinación de logística, inventario y transferencias', true, NOW()),

-- Roles analíticos y de supervisión
('Analista Senior', 'analista-senior', 5, 'Análisis avanzado de datos, reportes especializados', true, NOW()),
('Supervisor de Área', 'supervisor-area', 6, 'Supervisión departamental, control de equipos de trabajo', true, NOW()),
('Gestor de Inventario', 'gestor-inventario', 7, 'Gestión especializada de inventario y stock', true, NOW()),
('Analista Junior', 'analista-junior', 8, 'Análisis básico, reportes operativos', true, NOW()),

-- Roles operativos
('Operador de Almacén', 'operador-almacen', 9, 'Operaciones de almacén, movimientos de inventario', true, NOW()),
('Vendedor', 'vendedor', 10, 'Ventas y atención al cliente', true, NOW()),
('Cajero', 'cajero', 11, 'Operaciones de caja, cobros y pagos', true, NOW()),
('Sistema', 'system', 12, 'Procesos automáticos del sistema', true, NOW());

-- =====================================================
-- 2. MÓDULOS DE PERMISOS
-- =====================================================

-- DASHBOARD Y SISTEMA
INSERT INTO permissions (name, code, module, description, created_at) VALUES
('Ver Dashboard', 'view-dashboard', 'system', 'Acceso al panel principal del sistema', NOW()),
('Ver Perfil', 'view-profile', 'system', 'Visualizar y editar perfil personal', NOW());

-- GESTIÓN DE USUARIOS Y EMPRESA
INSERT INTO permissions (name, code, module, description, created_at) VALUES
('Ver Usuarios', 'view-users', 'users', 'Visualizar lista de usuarios', NOW()),
('Gestionar Usuarios', 'manage-users', 'users', 'Crear, editar y eliminar usuarios', NOW()),
('Ver Empresa', 'view-company', 'management', 'Visualizar información de la empresa', NOW()),
('Editar Empresa', 'edit-company', 'management', 'Modificar configuración de la empresa', NOW()),
('Ver Subsidiaria', 'view-subsidiary', 'management', 'Visualizar información de subsidiarias', NOW()),
('Editar Subsidiaria', 'edit-subsidiary', 'management', 'Modificar configuración de subsidiarias', NOW()),
('Ver Sucursal', 'view-branch', 'management', 'Visualizar información de sucursales', NOW()),
('Editar Sucursal', 'edit-branch', 'management', 'Modificar configuración de sucursales', NOW()),
('Editar Roles', 'edit-roles', 'management', 'Gestionar roles del sistema', NOW()),
('Gestionar Permisos', 'manage-permissions', 'management', 'Administrar permisos del sistema', NOW()),
('Gestionar Invitaciones', 'manage-invitations', 'management', 'Enviar y gestionar invitaciones', NOW());

-- MÓDULO DE INVENTARIO
INSERT INTO permissions (name, code, module, description, created_at) VALUES
('Ver Inventario', 'inventory.view', 'inventory', 'Visualizar inventario general', NOW()),
('Crear Productos', 'inventory.create', 'inventory', 'Agregar nuevos productos al inventario', NOW()),
('Actualizar Productos', 'inventory.update', 'inventory', 'Modificar información de productos', NOW()),
('Eliminar Productos', 'inventory.delete', 'inventory', 'Eliminar productos del inventario', NOW()),
('Ajustar Inventario', 'inventory.adjust', 'inventory', 'Realizar ajustes de stock', NOW()),
('Reservar Stock', 'inventory.reserve', 'inventory', 'Reservar productos para ventas', NOW()),
('Liberar Stock', 'inventory.release', 'inventory', 'Liberar productos reservados', NOW()),
('Transferir Inventario', 'inventory.transfer', 'inventory', 'Realizar transferencias entre almacenes', NOW()),
('Ver Movimientos', 'inventory.view_movements', 'inventory', 'Visualizar historial de movimientos', NOW()),
('Actualizar Niveles', 'inventory.update_levels', 'inventory', 'Modificar niveles mínimos y máximos', NOW()),
('Generar Reportes Inventario', 'inventory.generate_reports', 'inventory', 'Crear reportes de inventario', NOW());

-- MÓDULO DE TRANSFERENCIAS
INSERT INTO permissions (name, code, module, description, created_at) VALUES
('Ver Transferencias', 'transfers.view', 'transfers', 'Visualizar transferencias', NOW()),
('Crear Transferencias', 'transfers.create', 'transfers', 'Crear nuevas transferencias', NOW()),
('Actualizar Transferencias', 'transfers.update', 'transfers', 'Modificar transferencias existentes', NOW()),
('Eliminar Transferencias', 'transfers.delete', 'transfers', 'Eliminar transferencias', NOW()),
('Enviar Transferencias', 'transfers.ship', 'transfers', 'Marcar transferencias como enviadas', NOW()),
('Recibir Transferencias', 'transfers.receive', 'transfers', 'Procesar recepción de transferencias', NOW()),
('Aprobar Transferencias', 'transfers.approve', 'transfers', 'Aprobar transferencias pendientes', NOW()),
('Cancelar Transferencias', 'transfers.cancel', 'transfers', 'Cancelar transferencias', NOW()),
('Generar PDF Transferencias', 'transfers.generate_pdf', 'transfers', 'Generar documentos PDF', NOW());

-- MÓDULO COMERCIAL - VENTAS
INSERT INTO permissions (name, code, module, description, created_at) VALUES
('Ver Ventas', 'sales.view', 'sales', 'Visualizar ventas realizadas', NOW()),
('Crear Ventas', 'sales.create', 'sales', 'Registrar nuevas ventas', NOW()),
('Actualizar Ventas', 'sales.update', 'sales', 'Modificar ventas existentes', NOW()),
('Eliminar Ventas', 'sales.delete', 'sales', 'Eliminar registros de ventas', NOW()),
('Confirmar Ventas', 'sales.confirm', 'sales', 'Confirmar ventas realizadas', NOW()),
('Entregar Ventas', 'sales.deliver', 'sales', 'Marcar ventas como entregadas', NOW()),
('Cancelar Ventas', 'sales.cancel', 'sales', 'Cancelar ventas', NOW()),
('Agregar Pagos', 'sales.add_payments', 'sales', 'Registrar pagos de ventas', NOW()),
('Registrar Pago', 'sales.record_payment', 'sales', 'Procesar pagos individuales', NOW()),
('Confirmar Pagos', 'sales.confirm_payments', 'sales', 'Confirmar pagos recibidos', NOW()),
('Enviar Ventas', 'sales.ship', 'sales', 'Procesar envío de ventas', NOW()),
('Generar Facturas', 'sales.generate_invoice', 'sales', 'Crear facturas de ventas', NOW()),
('Gestionar Descuentos', 'sales.manage_discounts', 'sales', 'Aplicar descuentos en ventas', NOW());

-- MÓDULO COMERCIAL - COTIZACIONES
INSERT INTO permissions (name, code, module, description, created_at) VALUES
('Ver Cotizaciones', 'quotes.view', 'quotes', 'Visualizar cotizaciones', NOW()),
('Crear Cotizaciones', 'quotes.create', 'quotes', 'Crear nuevas cotizaciones', NOW()),
('Actualizar Cotizaciones', 'quotes.update', 'quotes', 'Modificar cotizaciones existentes', NOW()),
('Eliminar Cotizaciones', 'quotes.delete', 'quotes', 'Eliminar cotizaciones', NOW()),
('Enviar Cotizaciones', 'quotes.send', 'quotes', 'Enviar cotizaciones a clientes', NOW()),
('Aprobar Cotizaciones', 'quotes.approve', 'quotes', 'Aprobar cotizaciones', NOW()),
('Convertir Cotizaciones', 'quotes.convert', 'quotes', 'Convertir cotizaciones en ventas', NOW()),
('Generar PDF Cotizaciones', 'quotes.generate_pdf', 'quotes', 'Generar documentos PDF', NOW()),
('Gestionar Descuentos Cotizaciones', 'quotes.manage_discounts', 'quotes', 'Aplicar descuentos en cotizaciones', NOW());

-- MÓDULO TÉCNICO
INSERT INTO permissions (name, code, module, description, created_at) VALUES
('Ver Técnico', 'technical.view', 'technical', 'Acceso al módulo técnico', NOW()),
('Revisiones Técnicas', 'technical.reviews', 'technical', 'Realizar y gestionar revisiones técnicas', NOW());

-- MÓDULO DE REPORTES
INSERT INTO permissions (name, code, module, description, created_at) VALUES
('Ver Reportes', 'reports.view', 'reports', 'Acceso al módulo de reportes', NOW()),
('Dashboard de Ventas', 'reports.sales_dashboard', 'reports', 'Visualizar dashboard de ventas', NOW()),
('Reportes de Inventario', 'reports.inventory_reports', 'reports', 'Generar reportes de inventario', NOW()),
('Reporte de Inventario', 'reports.inventory_report', 'reports', 'Reporte específico de inventario', NOW()),
('Reportes de Transferencias', 'reports.transfer_reports', 'reports', 'Generar reportes de transferencias', NOW()),
('Conversión de Cotizaciones', 'reports.quote_conversion', 'reports', 'Reportes de conversión de cotizaciones', NOW()),
('Reportes Financieros', 'reports.financial_reports', 'reports', 'Generar reportes financieros', NOW()),
('Exportar Reportes', 'reports.export', 'reports', 'Exportar reportes a diferentes formatos', NOW());

-- MÓDULO DE RECURSOS HUMANOS
INSERT INTO permissions (name, code, module, description, created_at) VALUES
('Ver RRHH', 'hr.view', 'hr', 'Acceso al módulo de recursos humanos', NOW());

-- =====================================================
-- 3. ASIGNACIÓN DE PERMISOS A ROLES
-- =====================================================

-- SUPER ADMINISTRADOR - TODOS LOS PERMISOS
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT r.id, p.id, NOW()
FROM roles r, permissions p 
WHERE r.code = 'super-admin';

-- SUPERVISOR EMPRESA - Permisos ejecutivos
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT r.id, p.id, NOW()
FROM roles r, permissions p 
WHERE r.code = 'supervisor-empresa' 
AND p.code IN (
    'view-dashboard',
    'view-profile',
    'view-company',
    'view-subsidiary',
    'view-branch',
    'view-users',
    'inventory.view',
    'inventory.view_movements',
    'inventory.generate_reports',
    'transfers.view',
    'transfers.approve',
    'sales.view',
    'sales.confirm',
    'quotes.view',
    'quotes.approve',
    'reports.view',
    'reports.sales_dashboard',
    'reports.inventory_reports',
    'reports.financial_reports',
    'reports.export'
);

-- ADMINISTRADOR - Permisos administrativos
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT r.id, p.id, NOW()
FROM roles r, permissions p 
WHERE r.code = 'administrador' 
AND p.code IN (
    'view-dashboard',
    'view-profile',
    'view-users',
    'manage-users',
    'view-company',
    'edit-company',
    'view-subsidiary',
    'edit-subsidiary',
    'view-branch',
    'edit-branch',
    'edit-roles',
    'manage-permissions',
    'manage-invitations',
    'inventory.view',
    'inventory.create',
    'inventory.update',
    'inventory.delete',
    'inventory.adjust',
    'inventory.transfer',
    'inventory.view_movements',
    'inventory.update_levels',
    'transfers.view',
    'transfers.create',
    'transfers.update',
    'transfers.delete',
    'transfers.approve',
    'transfers.cancel',
    'sales.view',
    'sales.create',
    'sales.update',
    'sales.delete',
    'sales.confirm',
    'sales.cancel',
    'sales.manage_discounts',
    'quotes.view',
    'quotes.create',
    'quotes.update',
    'quotes.delete',
    'quotes.approve',
    'quotes.convert',
    'quotes.manage_discounts',
    'reports.view',
    'reports.sales_dashboard',
    'reports.inventory_reports',
    'reports.financial_reports',
    'hr.view'
);

-- GESTOR OPERATIVO - Operaciones generales
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT r.id, p.id, NOW()
FROM roles r, permissions p 
WHERE r.code = 'gestor-operativo' 
AND p.code IN (
    'view-dashboard',
    'view-profile',
    'inventory.view',
    'inventory.create',
    'inventory.update',
    'inventory.adjust',
    'inventory.transfer',
    'inventory.view_movements',
    'transfers.view',
    'transfers.create',
    'transfers.update',
    'transfers.ship',
    'transfers.receive',
    'sales.view',
    'sales.create',
    'sales.update',
    'sales.confirm',
    'sales.deliver',
    'quotes.view',
    'quotes.create',
    'quotes.update',
    'quotes.send',
    'quotes.convert',
    'reports.view',
    'reports.inventory_reports',
    'reports.transfer_reports'
);

-- COORDINADOR LOGÍSTICO - Logística e inventario
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT r.id, p.id, NOW()
FROM roles r, permissions p 
WHERE r.code = 'coordinador-logistico' 
AND p.code IN (
    'view-dashboard',
    'view-profile',
    'inventory.view',
    'inventory.create',
    'inventory.update',
    'inventory.adjust',
    'inventory.reserve',
    'inventory.release',
    'inventory.transfer',
    'inventory.view_movements',
    'transfers.view',
    'transfers.create',
    'transfers.update',
    'transfers.ship',
    'transfers.receive',
    'transfers.generate_pdf',
    'sales.view',
    'sales.ship',
    'reports.view',
    'reports.inventory_reports',
    'reports.transfer_reports'
);

-- ANALISTA SENIOR - Análisis avanzado
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT r.id, p.id, NOW()
FROM roles r, permissions p 
WHERE r.code = 'analista-senior' 
AND p.code IN (
    'view-dashboard',
    'view-profile',
    'inventory.view',
    'inventory.view_movements',
    'inventory.generate_reports',
    'transfers.view',
    'sales.view',
    'quotes.view',
    'reports.view',
    'reports.sales_dashboard',
    'reports.inventory_reports',
    'reports.transfer_reports',
    'reports.quote_conversion',
    'reports.financial_reports',
    'reports.export'
);

-- SUPERVISOR DE ÁREA - Supervisión departamental
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT r.id, p.id, NOW()
FROM roles r, permissions p 
WHERE r.code = 'supervisor-area' 
AND p.code IN (
    'view-dashboard',
    'view-profile',
    'view-users',
    'inventory.view',
    'inventory.update',
    'inventory.adjust',
    'inventory.view_movements',
    'transfers.view',
    'transfers.update',
    'transfers.approve',
    'sales.view',
    'sales.update',
    'sales.confirm',
    'quotes.view',
    'quotes.update',
    'quotes.approve',
    'reports.view',
    'reports.sales_dashboard',
    'reports.inventory_reports'
);

-- GESTOR DE INVENTARIO - Inventario especializado
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT r.id, p.id, NOW()
FROM roles r, permissions p 
WHERE r.code = 'gestor-inventario' 
AND p.code IN (
    'view-dashboard',
    'view-profile',
    'inventory.view',
    'inventory.create',
    'inventory.update',
    'inventory.delete',
    'inventory.adjust',
    'inventory.reserve',
    'inventory.release',
    'inventory.transfer',
    'inventory.view_movements',
    'inventory.update_levels',
    'inventory.generate_reports',
    'transfers.view',
    'transfers.create',
    'transfers.update',
    'reports.view',
    'reports.inventory_reports'
);

-- ANALISTA JUNIOR - Análisis básico
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT r.id, p.id, NOW()
FROM roles r, permissions p 
WHERE r.code = 'analista-junior' 
AND p.code IN (
    'view-dashboard',
    'view-profile',
    'inventory.view',
    'inventory.view_movements',
    'transfers.view',
    'sales.view',
    'quotes.view',
    'reports.view',
    'reports.sales_dashboard',
    'reports.inventory_reports'
);

-- OPERADOR DE ALMACÉN - Operaciones de almacén
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT r.id, p.id, NOW()
FROM roles r, permissions p 
WHERE r.code = 'operador-almacen' 
AND p.code IN (
    'view-dashboard',
    'view-profile',
    'inventory.view',
    'inventory.update',
    'inventory.adjust',
    'inventory.reserve',
    'inventory.release',
    'inventory.view_movements',
    'transfers.view',
    'transfers.receive',
    'transfers.ship'
);

-- VENDEDOR - Ventas y cotizaciones
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT r.id, p.id, NOW()
FROM roles r, permissions p 
WHERE r.code = 'vendedor' 
AND p.code IN (
    'view-dashboard',
    'view-profile',
    'inventory.view',
    'sales.view',
    'sales.create',
    'sales.update',
    'sales.deliver',
    'sales.add_payments',
    'quotes.view',
    'quotes.create',
    'quotes.update',
    'quotes.send',
    'quotes.convert',
    'quotes.generate_pdf'
);

-- CAJERO - Operaciones de caja
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT r.id, p.id, NOW()
FROM roles r, permissions p 
WHERE r.code = 'cajero' 
AND p.code IN (
    'view-dashboard',
    'view-profile',
    'inventory.view',
    'sales.view',
    'sales.create',
    'sales.add_payments',
    'sales.record_payment',
    'sales.confirm_payments',
    'sales.generate_invoice',
    'quotes.view'
);

-- SISTEMA - Permisos mínimos para procesos automáticos
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT r.id, p.id, NOW()
FROM roles r, permissions p 
WHERE r.code = 'system' 
AND p.code IN (
    'inventory.view',
    'inventory.update',
    'inventory.adjust',
    'sales.view',
    'sales.update'
);

-- =====================================================
-- 4. ÍNDICES PARA MEJORAR RENDIMIENTO
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_roles_code ON roles(code);
CREATE INDEX IF NOT EXISTS idx_roles_level ON roles(level);
CREATE INDEX IF NOT EXISTS idx_permissions_code ON permissions(code);
CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

-- =====================================================
-- 5. VERIFICACIÓN DE DATOS
-- =====================================================
SELECT 
    'Roles creados:' as tipo,
    COUNT(*) as cantidad
FROM roles
UNION ALL
SELECT 
    'Permisos creados:' as tipo,
    COUNT(*) as cantidad
FROM permissions
UNION ALL
SELECT 
    'Asignaciones creadas:' as tipo,
    COUNT(*) as cantidad
FROM role_permissions;

-- Mostrar resumen por rol
SELECT 
    r.name as rol,
    r.code as codigo,
    COUNT(rp.permission_id) as permisos_asignados
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.id, r.name, r.code
ORDER BY r.level;

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================
-- Este seed incluye:
-- - 13 roles empresariales jerárquicos (niveles 0-12)
-- - 65+ permisos organizados por módulos
-- - Asignaciones lógicas según la jerarquía empresarial
-- - Índices optimizados para consultas
-- 
-- Para usar este seed:
-- 1. Ajusta los nombres de tablas según tu esquema
-- 2. Ejecuta en tu base de datos
-- 3. Verifica que los datos se crearon correctamente
-- 4. Ajusta permisos específicos según tus necesidades
