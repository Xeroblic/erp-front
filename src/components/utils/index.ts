/**
 * Componentes y hooks reutilizables de utilidad
 * Escalables para múltiples contextos de la aplicación
 */

// Quick Product Flow - Crear producto rápido con marca
export { QuickProductFlowModal, useQuickProduct } from './QuickProductFlow';
export type { IQuickProductForm, IUseQuickProductOptions, IUseQuickProductReturn } from './QuickProductFlow';
export { QuickProductFormSchema } from './QuickProductFlow';

// Layout / Visibility utilities
export { default as Collapse } from './Collapse';
export { default as Visible } from './Visible';
