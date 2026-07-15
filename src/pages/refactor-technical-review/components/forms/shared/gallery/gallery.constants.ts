/**
 * gallery.constants.ts
 * Reglas de validación cliente para la carga de fotos de revisiones técnicas.
 * Deben reflejar las reglas del backend (ver plan de integración).
 */

/** Permisos backend asociados a la galería. */
export const PHOTO_VIEW_PERMISSION = 'view-technical-reviews-items';
export const PHOTO_EDIT_PERMISSION = 'review-technical-reviews-items';

/** Máximo de fotos por petición de carga. */
export const MAX_PHOTOS_PER_UPLOAD = 20;

/** Tamaño máximo por archivo: 8 MB (8192 KB). */
export const MAX_PHOTO_SIZE_KB = 8192;
export const MAX_PHOTO_SIZE_BYTES = MAX_PHOTO_SIZE_KB * 1024;

/** Extensiones permitidas. */
export const ALLOWED_PHOTO_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'] as const;

/** MIME types permitidos (para el atributo accept y validación). */
export const ALLOWED_PHOTO_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'] as const;

export const PHOTO_ACCEPT_ATTR = '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp';
