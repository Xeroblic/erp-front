// // src/constants/roles.ts
// import { AUTH } from './authority';

// /**
//  * Mapas de permisos por rol (estático solo como ejemplo; idealmente se obtendrían de la API).
//  */
// export const ROLES = {
//   EMPRESA_ADMIN: [
//     AUTH.PRODUCTOS_CRUD,     // create, read, update, delete productos
//     AUTH.EMPRESA_CRUD,       // CRUD empresas
//     AUTH.USUARIOS_VIEW,      // ver usuarios
//     AUTH.USUARIOS_INVITE,    // invitar usuarios
//     AUTH.SUBEMPRESA_CRUD,    // CRUD subempresas
//     AUTH.SUCURSAL_CRUD,      // CRUD sucursales
//     AUTH.COTIZACIONES_CRUD,  // CRUD cotizaciones
//     AUTH.ROLES_CRUD,         // CRUD roles
//   ],
//   SUBEMPRESA_ADMIN: [
//     AUTH.SUBEMPRESA_CRUD,    // CRUD subempresas
//     AUTH.SUCURSAL_CRUD,      // CRUD sucursales
//     AUTH.USUARIOS_VIEW,      // ver usuarios
//     AUTH.COTIZACIONES_CRUD,  // CRUD cotizaciones
//   ],
//   SUCURSAL_ADMIN: [
//     AUTH.SUCURSAL_CRUD,      // CRUD sucursales
//     AUTH.EMPLEADOS_VIEW,     // ver empleados
//     AUTH.COTIZACIONES_CRUD,  // CRUD cotizaciones
//   ],
//   EMPLEADO: [
//     AUTH.COTIZACIONES_CRUD,  // CRUD cotizaciones (o podrías usar solo lectura si defines COTIZACIONES_VIEW)
//   ],
// } as const;
