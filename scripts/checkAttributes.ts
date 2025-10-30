import ATTRIBUTES_FIELD_PATHS from '../src/pages/catalogos/productos/constants/attributesFieldPaths';

// Puedes pegar aquí cualquier payload para testear
const payload = {
  attributes_json: {
    os: {
      name: 'Windows',
      version: '10 Home',
      can_upgrade_edition: true,
    },
    CPU: 'I7 8350U',
    RAM: '16 GB',
    cpu: {
      brand: 'Intel',
      model: '23232',
      family: 'Pentium',
      generation: '5th Gen',
    },
    gpu: {
      type: 'integrated',
      model: '2dsdsds',
    },
    ram: {
      type: 'DDR5',
      channel: 'dual',
      modules: 0,
      upgradable: true,
      capacity_gb: 8,
      max_supported_gb: 8,
    },
    grade: 'B',
    storage: {
      config: 'hybrid',
      primary: {
        type: 'NVMe',
        capacity_gb: 1000,
      },
      secondary: {
        type: 'SSD SATA',
        capacity_gb: 128,
      },
      upgradable: true,
      available_slots: {
        m2: 0,
        sata: 3232,
      },
      max_supported_gb: 21323,
    },
    packaging: {
      charger_type: 'genérico',
      charger_included: true,
    },
    connectivity: {
      wifi: '802.11ac',
      ethernet: '2.5GbE',
      bluetooth: '4.2',
    },
    product_kind: 'desktop_pc',
    category_grade: 'A',
  },
};

function getByPath(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.');
  let cur: any = obj;
  for (const p of parts) {
    if (cur === undefined || cur === null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function isMissing(v: any): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === 'string' && v.trim() === '') return true;
  if (Array.isArray(v) && v.length === 0) return true;
  return false;
}

function check(payload: any, productType: string): string[] {
  const attrs = payload.attributes_json || payload;
  const required = ATTRIBUTES_FIELD_PATHS[productType] || ATTRIBUTES_FIELD_PATHS.general || [];
  const missing: string[] = [];
  for (const path of required) {
    const v = getByPath(attrs, path);
    if (isMissing(v)) missing.push(path);
  }
  return missing;
}

const productType = 'desktop_pc';
const missing = check(payload, productType);
console.log('Missing paths for type', productType, ':', missing);
console.log('Count:', missing.length);
