import store from './storeSetup'

export * from './storeSetup'
export * from './rootReducer'
export * from './hook'

export * from './slices/auth/authSlice'
// Exportar todo del personalizacionSlice
export * from './slices/personalizacion/personalizacionSlice'

// Exportar slices del ERP
export * from './slices/transfers/transfersSlice'
export * from './slices/categories/categoriesSlice'
export * from './slices/products/productsSlice'

export default store

