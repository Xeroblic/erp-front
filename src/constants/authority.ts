export const AUTH = {
  PRODUCTOS_CRUD:   'productos:*',      // equivale a create,edit,delete,view
  USUARIOS_READ:    'usuarios:view',
  USUARIOS_INVITE:  'usuarios:invite',
  ORG_SUBEMPRESA:   'subempresas:*',
  ORG_SUCURSAL:     'sucursales:*',
  COTIZACIONES_CRUD:'cotizaciones:*',
  COTIZACIONES_READ:'cotizaciones:view',
  EMPLEADOS_READ:   'empleados:view',   
  ORG_EMPRESA:     'empresa:*',       // si lo defines
} as const;
