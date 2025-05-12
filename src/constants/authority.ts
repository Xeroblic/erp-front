export const AUTH = {
  DASH_EMPRESA:      'dash:empresa',
  DASH_SUBEMPRESA:   'dash:subempresa',
  DASH_SUCURSAL:     'dash:sucursal',

  SUBEMPRESA_CRUD:   'org:subempresa:*',
  SUCURSAL_CRUD:     'org:sucursal:*',

  EMPLEADOS_READ:    'empleados:read',
  EMPLEADOS_CRUD:    'empleados:*',

  COTIZACIONES_READ: 'cot:read',
  COTIZACIONES_CRUD: 'cot:*',
} as const;
