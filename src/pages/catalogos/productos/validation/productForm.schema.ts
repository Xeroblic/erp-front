import * as Yup from 'yup';

const optionSchema = Yup.object({
  value: Yup.string().required(),
  label: Yup.string().required(),
});

export const attributesSchema = Yup.object({
  cpu: Yup.object({
    brand: Yup.string().oneOf(["Intel", "AMD"]).required(),
    family: Yup.string().required(),
    generation: Yup.string().required(),
    model: Yup.string().required(),
    cores: Yup.object({ min: Yup.number().min(1).required(), max: Yup.number().min(1).required() })
      .test("cores-range", "cores.min debe ser <= cores.max", (v) => !v || v.min <= v.max),
    threads: Yup.object({ min: Yup.number().min(1).required(), max: Yup.number().min(1).required() })
      .test("threads-range", "threads.min debe ser <= threads.max", (v) => !v || v.min <= v.max),
    base_clock_mhz: Yup.object({ min: Yup.number().min(200).required(), max: Yup.number().min(200).required() })
      .test("base-range", "base.min <= base.max", (v) => !v || v.min <= v.max),
    boost_clock_mhz: Yup.object({ min: Yup.number().min(200).required(), max: Yup.number().min(200).required() })
      .test("boost-range", "boost.min <= boost.max", (v) => !v || v.min <= v.max),
  }).required(),
  ram: Yup.object({
    type: Yup.string().oneOf(["DDR3", "DDR4", "DDR5"]).required(),
    min_gb: Yup.number().min(1).required(),
    max_gb: Yup.number().min(1).required(),
  }).test("ram-range", "min_gb <= max_gb", (v) => !v || v.min_gb <= v.max_gb),
  storage: Yup.object({
    config: Yup.string().oneOf(["single", "hybrid"]).required(),
    single: Yup.object({
      type: Yup.string().oneOf(["NVMe", "SSD_SATA", "HDD"]).nullable(),
      size_gb: Yup.object({ min: Yup.number().nullable(), max: Yup.number().nullable() }).nullable(),
    }).nullable(),
    hybrid: Yup.object({
      primary: Yup.object({
        type: Yup.string().oneOf(["NVMe", "SSD_SATA"]).nullable(),
        size_gb: Yup.object({ min: Yup.number().nullable(), max: Yup.number().nullable() }).nullable(),
      }).nullable(),
      secondary: Yup.object({
        type: Yup.string().oneOf(["HDD", "SSD_SATA", "NVMe"]).nullable(),
        size_gb: Yup.object({ min: Yup.number().nullable(), max: Yup.number().nullable() }).nullable(),
      }).nullable(),
      allowed_combinations: Yup.array().of(Yup.array().of(Yup.string())).nullable(),
    }).nullable(),
  }).required(),
});

export const productSchema = Yup.object({
  sku: Yup.string().required("SKU requerido"),
  name: Yup.string().required("Nombre requerido"),
  brand_id: Yup.number().typeError("Marca inválida").required("Marca requerida"),
  uom: Yup.string().nullable(),
  condition_policy: Yup.string().nullable(),

  price: Yup.number().typeError("Precio inválido").min(0).required("Precio requerido"),
  cost: Yup.number().typeError("Costo inválido").min(0).nullable(),
  offer_price: Yup.number().typeError("Precio oferta inválido").min(0).nullable(),
  warranty_months: Yup.number().typeError("Meses inválidos").min(0).integer().nullable(),

  product_type: Yup.string().nullable(), // Permitir cualquier valor o null
  device_type: Yup.string().nullable(),

  categories: Yup.array().of(Yup.object({ value: Yup.number().required(), label: Yup.string().required() })),
  attributes_json: Yup.mixed().nullable(),
});

// Schema para creación: requiere campos obligatorios según backend (StoreProductRequest)
export const productSchemaCreate = Yup.object({
  sku: Yup.string().required('SKU requerido').max(255, 'Máximo 255 caracteres'),
  name: Yup.string().required('Nombre requerido').max(255, 'Máximo 255 caracteres'),
  brand_id: Yup.number().typeError('Marca inválida').required('Marca requerida'),
  branch_id: Yup.number().typeError('Sucursal inválida').required('Debe seleccionar una sucursal').nullable(),
  price: Yup.number().typeError('Precio inválido').min(0, 'Precio debe ser mayor o igual a 0').required('Precio requerido'),
  categories: Yup.array()
    .of(Yup.object({ value: Yup.number().required(), label: Yup.string().required() }))
    .min(1, 'Selecciona al menos una categoría')
    .required('Categorías requeridas'),
  // Campos opcionales
  commercial_sku: Yup.string().max(255).nullable(),
  barcode: Yup.string().max(255).nullable(),
  product_type: Yup.string().nullable(), // Permitir cualquier valor
  device_type: Yup.string().nullable(),
  condition_policy: Yup.string().nullable(),
  uom: Yup.string().nullable(),
  cost: Yup.number().typeError('Costo inválido').min(0).nullable(),
  offer_price: Yup.number().typeError('Precio oferta inválido').min(0).nullable(),
  warranty_months: Yup.number().typeError('Meses inválidos').min(0).integer().nullable(),
  serial_tracking: Yup.boolean(),
  is_active: Yup.boolean(),
  attributes_json: Yup.mixed().nullable(),
});