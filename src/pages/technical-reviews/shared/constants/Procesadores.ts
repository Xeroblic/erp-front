export type TipoDispositivo = 'Notebook' | 'AIO' | 'Desktop';
export type MarcaProcesador = 'Intel' | 'AMD';

export interface ModeloProcesador {
    id: string;
    nombre: string;
    descripcion?: string;
}

export interface Generacion {
    id: string;
    nombre: string;
    año?: number;
    arquitectura?: string;
    modelos: ModeloProcesador[];
}

export interface FamiliaProcesador {
    id: string;
    nombre: string;
    descripcion?: string;
    generaciones: Generacion[];
}

export interface MarcaData {
    id: string;
    nombre: MarcaProcesador;
    familias: FamiliaProcesador[];
}

export interface DispositivoData {
    id: string;
    tipo: TipoDispositivo;
    marcas: MarcaData[];
}

export const PROCESADORES_DATA: DispositivoData[] = [
    {
        id: 'notebook',
        tipo: 'Notebook',
        marcas: [
            {
                id: 'intel-notebook',
                nombre: 'Intel',
                familias: [
                    {
                        id: 'core-i9-ultra9-notebook',
                        nombre: 'Core i9 / Ultra 9',
                        descripcion: 'La Elite / Streaming / Render',
                        generaciones: [
                            {
                                id: 'ultra2-i9-notebook',
                                nombre: 'Ultra 2 (2025)',
                                año: 2025,
                                modelos: [
                                    { id: 'ultra9-285h', nombre: 'Ultra 9 285H' }
                                ]
                            },
                            {
                                id: 'ultra1-i9-notebook',
                                nombre: 'Ultra 1 (2024)',
                                año: 2024,
                                modelos: [
                                    { id: 'ultra9-185h', nombre: 'Ultra 9 185H' }
                                ]
                            },
                            {
                                id: '14gen-i9-notebook',
                                nombre: '14ª Gen (Raptor Lake R)',
                                año: 2024,
                                arquitectura: 'Raptor Lake Refresh',
                                modelos: [
                                    { id: 'i9-14900hx', nombre: 'i9-14900HX' }
                                ]
                            },
                            {
                                id: '13gen-i9-notebook',
                                nombre: '13ª Gen (Raptor Lake)',
                                año: 2023,
                                arquitectura: 'Raptor Lake',
                                modelos: [
                                    { id: 'i9-13980hx', nombre: 'i9-13980HX' },
                                    { id: 'i9-13900hk', nombre: 'i9-13900HK' }
                                ]
                            },
                            {
                                id: '12gen-i9-notebook',
                                nombre: '12ª Gen (Alder Lake)',
                                año: 2022,
                                arquitectura: 'Alder Lake',
                                modelos: [
                                    { id: 'i9-12900hk', nombre: 'i9-12900HK' }
                                ]
                            },
                            {
                                id: '11gen-i9-notebook',
                                nombre: '11ª Gen',
                                año: 2021,
                                modelos: [
                                    { id: 'i9-11980hk', nombre: 'i9-11980HK' }
                                ]
                            },
                            {
                                id: '10gen-i9-notebook',
                                nombre: '10ª Gen',
                                año: 2020,
                                modelos: [
                                    { id: 'i9-10980hk', nombre: 'i9-10980HK' },
                                    { id: 'i9-10885h', nombre: 'i9-10885H' }
                                ]
                            },
                            {
                                id: '9gen-i9-notebook',
                                nombre: '9ª Gen',
                                año: 2019,
                                modelos: [
                                    { id: 'i9-9980hk', nombre: 'i9-9980HK' },
                                    { id: 'i9-9880h', nombre: 'i9-9880H' }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'core-i7-ultra7-notebook',
                        nombre: 'Core i7 / Ultra 7',
                        descripcion: 'Gama Alta / Gaming Pro',
                        generaciones: [
                            {
                                id: 'ultra2-i7-notebook',
                                nombre: 'Ultra 2 (2025)',
                                año: 2025,
                                modelos: [
                                    { id: 'ultra7-258v', nombre: 'Ultra 7 258V' },
                                    { id: 'ultra7-268v', nombre: 'Ultra 7 268V' }
                                ]
                            },
                            {
                                id: 'ultra1-i7-notebook',
                                nombre: 'Ultra 1 (2024)',
                                año: 2024,
                                modelos: [
                                    { id: 'ultra7-155h', nombre: 'Ultra 7 155H' },
                                    { id: 'ultra7-165h', nombre: 'Ultra 7 165H' },
                                    { id: 'ultra7-155u', nombre: 'Ultra 7 155U' }
                                ]
                            },
                            {
                                id: '14gen-i7-notebook',
                                nombre: '14ª Gen',
                                año: 2024,
                                modelos: [
                                    { id: 'i7-14700hx', nombre: 'i7-14700HX' }
                                ]
                            },
                            {
                                id: '13gen-i7-notebook',
                                nombre: '13ª Gen',
                                año: 2023,
                                modelos: [
                                    { id: 'i7-13700h', nombre: 'i7-13700H' },
                                    { id: 'i7-13650hx', nombre: 'i7-13650HX' },
                                    { id: 'i7-1355u', nombre: 'i7-1355U' }
                                ]
                            },
                            {
                                id: '12gen-i7-notebook',
                                nombre: '12ª Gen',
                                año: 2022,
                                modelos: [
                                    { id: 'i7-12700h', nombre: 'i7-12700H' },
                                    { id: 'i7-1260p', nombre: 'i7-1260P' },
                                    { id: 'i7-1255u', nombre: 'i7-1255U' }
                                ]
                            },
                            {
                                id: '11gen-i7-notebook',
                                nombre: '11ª Gen',
                                año: 2021,
                                modelos: [
                                    { id: 'i7-11800h', nombre: 'i7-11800H' },
                                    { id: 'i7-1165g7', nombre: 'i7-1165G7' }
                                ]
                            },
                            {
                                id: '10gen-i7-notebook',
                                nombre: '10ª Gen',
                                año: 2020,
                                modelos: [
                                    { id: 'i7-10750h', nombre: 'i7-10750H' },
                                    { id: 'i7-10510u', nombre: 'i7-10510U' },
                                    { id: 'i7-1065g7', nombre: 'i7-1065G7' }
                                ]
                            },
                            {
                                id: '9gen-i7-notebook',
                                nombre: '9ª Gen',
                                año: 2019,
                                modelos: [
                                    { id: 'i7-9750h', nombre: 'i7-9750H' }
                                ]
                            },
                            {
                                id: '8gen-i7-notebook',
                                nombre: '8ª Gen',
                                año: 2018,
                                modelos: [
                                    { id: 'i7-8550u', nombre: 'i7-8550U' },
                                    { id: 'i7-8750h', nombre: 'i7-8750H' }
                                ]
                            },
                            {
                                id: '7gen-i7-notebook',
                                nombre: '7ª Gen',
                                año: 2017,
                                modelos: [
                                    { id: 'i7-7700hq', nombre: 'i7-7700HQ' }
                                ]
                            },
                            {
                                id: '6gen-i7-notebook',
                                nombre: '6ª Gen',
                                año: 2016,
                                modelos: [
                                    { id: 'i7-6700hq', nombre: 'i7-6700HQ' }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'core-i5-ultra5-notebook',
                        nombre: 'Core i5 / Ultra 5',
                        descripcion: 'Gama Media / Calidad-Precio',
                        generaciones: [
                            {
                                id: 'ultra2-i5-notebook',
                                nombre: 'Ultra 2 (2025)',
                                año: 2025,
                                modelos: [
                                    { id: 'ultra5-226v', nombre: 'Ultra 5 226V' },
                                    { id: 'ultra5-236v', nombre: 'Ultra 5 236V' }
                                ]
                            },
                            {
                                id: 'ultra1-i5-notebook',
                                nombre: 'Ultra 1 (2024)',
                                año: 2024,
                                modelos: [
                                    { id: 'ultra5-125h', nombre: 'Ultra 5 125H' },
                                    { id: 'ultra5-135h', nombre: 'Ultra 5 135H' },
                                    { id: 'ultra5-125u', nombre: 'Ultra 5 125U' }
                                ]
                            },
                            {
                                id: '14gen-i5-notebook',
                                nombre: '14ª Gen',
                                año: 2024,
                                modelos: [
                                    { id: 'i5-14500hx', nombre: 'i5-14500HX' }
                                ]
                            },
                            {
                                id: '13gen-i5-notebook',
                                nombre: '13ª Gen',
                                año: 2023,
                                modelos: [
                                    { id: 'i5-13500h', nombre: 'i5-13500H' },
                                    { id: 'i5-1335u', nombre: 'i5-1335U' }
                                ]
                            },
                            {
                                id: '12gen-i5-notebook',
                                nombre: '12ª Gen',
                                año: 2022,
                                modelos: [
                                    { id: 'i5-12500h', nombre: 'i5-12500H' },
                                    { id: 'i5-1235u', nombre: 'i5-1235U' }
                                ]
                            },
                            {
                                id: '11gen-i5-notebook',
                                nombre: '11ª Gen',
                                año: 2021,
                                modelos: [
                                    { id: 'i5-11300h', nombre: 'i5-11300H' },
                                    { id: 'i5-1135g7', nombre: 'i5-1135G7' }
                                ]
                            },
                            {
                                id: '10gen-i5-notebook',
                                nombre: '10ª Gen',
                                año: 2020,
                                modelos: [
                                    { id: 'i5-10300h', nombre: 'i5-10300H' },
                                    { id: 'i5-10210u', nombre: 'i5-10210U' }
                                ]
                            },
                            {
                                id: '9gen-i5-notebook',
                                nombre: '9ª Gen',
                                año: 2019,
                                modelos: [
                                    { id: 'i5-9300h', nombre: 'i5-9300H' }
                                ]
                            },
                            {
                                id: '8gen-i5-notebook',
                                nombre: '8ª Gen',
                                año: 2018,
                                modelos: [
                                    { id: 'i5-8250u', nombre: 'i5-8250U' },
                                    { id: 'i5-8300h', nombre: 'i5-8300H' }
                                ]
                            },
                            {
                                id: '7gen-i5-notebook',
                                nombre: '7ª Gen',
                                año: 2017,
                                modelos: [
                                    { id: 'i5-7200u', nombre: 'i5-7200U' }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'core-i3-core3-notebook',
                        nombre: 'Core i3 / Core 3',
                        descripcion: 'Gama Entrada / Oficina',
                        generaciones: [
                            {
                                id: 'core-2024-notebook',
                                nombre: 'Serie Core (2024/25)',
                                año: 2024,
                                modelos: [
                                    { id: 'core3-100u', nombre: 'Core 3 100U' }
                                ]
                            },
                            {
                                id: '13gen-i3-notebook',
                                nombre: '13ª Gen',
                                año: 2023,
                                modelos: [
                                    { id: 'i3-1315u', nombre: 'i3-1315U' }
                                ]
                            },
                            {
                                id: '12gen-i3-notebook',
                                nombre: '12ª Gen',
                                año: 2022,
                                modelos: [
                                    { id: 'i3-1215u', nombre: 'i3-1215U' }
                                ]
                            },
                            {
                                id: '11gen-i3-notebook',
                                nombre: '11ª Gen',
                                año: 2021,
                                modelos: [
                                    { id: 'i3-1115g4', nombre: 'i3-1115G4' }
                                ]
                            },
                            {
                                id: '10gen-i3-notebook',
                                nombre: '10ª Gen',
                                año: 2020,
                                modelos: [
                                    { id: 'i3-10110u', nombre: 'i3-10110U' },
                                    { id: 'i3-1005g1', nombre: 'i3-1005G1' }
                                ]
                            },
                            {
                                id: '7gen-i3-notebook',
                                nombre: '7ª Gen',
                                año: 2017,
                                modelos: [
                                    { id: 'i3-7100u', nombre: 'i3-7100U' }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'economicos-notebook',
                        nombre: 'Económicos (Celeron, Pentium, N-Series)',
                        descripcion: 'Uso básico',
                        generaciones: [
                            {
                                id: 'nseries-2024-notebook',
                                nombre: 'Nueva Era N-Series (2024-2026)',
                                año: 2024,
                                modelos: [
                                    { id: 'n100', nombre: 'Intel N100' },
                                    { id: 'n200', nombre: 'Intel N200' },
                                    { id: 'n300', nombre: 'Intel N300' }
                                ]
                            },
                            {
                                id: 'pentium-notebook',
                                nombre: 'Pentium Gold/Silver',
                                modelos: [
                                    { id: 'n6000', nombre: 'Pentium N6000' },
                                    { id: 'n5030', nombre: 'Pentium N5030' }
                                ]
                            },
                            {
                                id: 'celeron-notebook',
                                nombre: 'Celeron',
                                modelos: [
                                    { id: 'n4020', nombre: 'Celeron N4020' },
                                    { id: 'n4500', nombre: 'Celeron N4500' },
                                    { id: 'j4125', nombre: 'Celeron J4125' }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                id: 'amd-notebook',
                nombre: 'AMD',
                familias: [
                    {
                        id: 'ryzen-9-notebook',
                        nombre: 'Ryzen 9',
                        descripcion: 'La Elite AMD para Laptops',
                        generaciones: [
                            {
                                id: 'ryzen9-8000-notebook',
                                nombre: 'Serie 8000 (Zen 4)',
                                año: 2024,
                                modelos: [
                                    { id: 'r9-8945hs', nombre: 'Ryzen 9 8945HS' },
                                    { id: 'r9-8945h', nombre: 'Ryzen 9 8945H' }
                                ]
                            },
                            {
                                id: 'ryzen9-7000-notebook',
                                nombre: 'Serie 7000 (Zen 4)',
                                año: 2023,
                                modelos: [
                                    { id: 'r9-7945hx', nombre: 'Ryzen 9 7945HX' },
                                    { id: 'r9-7940hs', nombre: 'Ryzen 9 7940HS' }
                                ]
                            },
                            {
                                id: 'ryzen9-6000-notebook',
                                nombre: 'Serie 6000 (Zen 3+)',
                                año: 2022,
                                modelos: [
                                    { id: 'r9-6900hx', nombre: 'Ryzen 9 6900HX' },
                                    { id: 'r9-6900hs', nombre: 'Ryzen 9 6900HS' }
                                ]
                            },
                            {
                                id: 'ryzen9-5000-notebook',
                                nombre: 'Serie 5000 (Zen 3)',
                                año: 2021,
                                modelos: [
                                    { id: 'r9-5900hx', nombre: 'Ryzen 9 5900HX' },
                                    { id: 'r9-5980hs', nombre: 'Ryzen 9 5980HS' }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'ryzen-7-notebook',
                        nombre: 'Ryzen 7',
                        descripcion: 'Gaming y Creación de Contenido',
                        generaciones: [
                            {
                                id: 'ryzen7-8000-notebook',
                                nombre: 'Serie 8000 (Zen 4)',
                                año: 2024,
                                modelos: [
                                    { id: 'r7-8845hs', nombre: 'Ryzen 7 8845HS' },
                                    { id: 'r7-8840u', nombre: 'Ryzen 7 8840U' }
                                ]
                            },
                            {
                                id: 'ryzen7-7000-notebook',
                                nombre: 'Serie 7000 (Zen 4)',
                                año: 2023,
                                modelos: [
                                    { id: 'r7-7840hs', nombre: 'Ryzen 7 7840HS' },
                                    { id: 'r7-7730u', nombre: 'Ryzen 7 7730U' }
                                ]
                            },
                            {
                                id: 'ryzen7-6000-notebook',
                                nombre: 'Serie 6000 (Zen 3+)',
                                año: 2022,
                                modelos: [
                                    { id: 'r7-6800h', nombre: 'Ryzen 7 6800H' },
                                    { id: 'r7-6800u', nombre: 'Ryzen 7 6800U' }
                                ]
                            },
                            {
                                id: 'ryzen7-5000-notebook',
                                nombre: 'Serie 5000 (Zen 3)',
                                año: 2021,
                                modelos: [
                                    { id: 'r7-5800h', nombre: 'Ryzen 7 5800H' },
                                    { id: 'r7-5800u', nombre: 'Ryzen 7 5800U' }
                                ]
                            },
                            {
                                id: 'ryzen7-4000-notebook',
                                nombre: 'Serie 4000 (Zen 2)',
                                año: 2020,
                                modelos: [
                                    { id: 'r7-4800h', nombre: 'Ryzen 7 4800H' },
                                    { id: 'r7-4700u', nombre: 'Ryzen 7 4700U' }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'ryzen-5-notebook',
                        nombre: 'Ryzen 5',
                        descripcion: 'Calidad-Precio',
                        generaciones: [
                            {
                                id: 'ryzen5-8000-notebook',
                                nombre: 'Serie 8000 (Zen 4)',
                                año: 2024,
                                modelos: [
                                    { id: 'r5-8645hs', nombre: 'Ryzen 5 8645HS' },
                                    { id: 'r5-8640u', nombre: 'Ryzen 5 8640U' }
                                ]
                            },
                            {
                                id: 'ryzen5-7000-notebook',
                                nombre: 'Serie 7000 (Zen 4)',
                                año: 2023,
                                modelos: [
                                    { id: 'r5-7640hs', nombre: 'Ryzen 5 7640HS' },
                                    { id: 'r5-7535u', nombre: 'Ryzen 5 7535U' }
                                ]
                            },
                            {
                                id: 'ryzen5-6000-notebook',
                                nombre: 'Serie 6000 (Zen 3+)',
                                año: 2022,
                                modelos: [
                                    { id: 'r5-6600h', nombre: 'Ryzen 5 6600H' },
                                    { id: 'r5-6600u', nombre: 'Ryzen 5 6600U' }
                                ]
                            },
                            {
                                id: 'ryzen5-5000-notebook',
                                nombre: 'Serie 5000 (Zen 3)',
                                año: 2021,
                                modelos: [
                                    { id: 'r5-5600h', nombre: 'Ryzen 5 5600H' },
                                    { id: 'r5-5500u', nombre: 'Ryzen 5 5500U' }
                                ]
                            },
                            {
                                id: 'ryzen5-4000-notebook',
                                nombre: 'Serie 4000 (Zen 2)',
                                año: 2020,
                                modelos: [
                                    { id: 'r5-4600h', nombre: 'Ryzen 5 4600H' },
                                    { id: 'r5-4500u', nombre: 'Ryzen 5 4500U' }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'ryzen-3-notebook',
                        nombre: 'Ryzen 3',
                        descripcion: 'Entrada Decente',
                        generaciones: [
                            {
                                id: 'ryzen3-7000-notebook',
                                nombre: 'Serie 7000 (Zen 4)',
                                año: 2023,
                                modelos: [
                                    { id: 'r3-7330u', nombre: 'Ryzen 3 7330U' }
                                ]
                            },
                            {
                                id: 'ryzen3-5000-notebook',
                                nombre: 'Serie 5000 (Zen 3)',
                                año: 2021,
                                modelos: [
                                    { id: 'r3-5300u', nombre: 'Ryzen 3 5300U' }
                                ]
                            },
                            {
                                id: 'ryzen3-4000-notebook',
                                nombre: 'Serie 4000 (Zen 2)',
                                año: 2020,
                                modelos: [
                                    { id: 'r3-4300u', nombre: 'Ryzen 3 4300U' }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'athlon-notebook',
                        nombre: 'Athlon',
                        descripcion: 'Lo Más Barato de AMD',
                        generaciones: [
                            {
                                id: 'athlon-gold-notebook',
                                nombre: 'Athlon Gold/Silver',
                                modelos: [
                                    { id: 'athlon-gold-3150u', nombre: 'Athlon Gold 3150U' },
                                    { id: 'athlon-silver-3050u', nombre: 'Athlon Silver 3050U' }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    },

    {
        id: 'desktop',
        tipo: 'Desktop',
        marcas: [
            {
                id: 'intel-desktop',
                nombre: 'Intel',
                familias: [
                    {
                        id: 'core-i9-ultra9-desktop',
                        nombre: 'Core i9 / Ultra 9',
                        descripcion: 'La Elite / Streaming / Render',
                        generaciones: [
                            {
                                id: 'ultra2-i9-desktop',
                                nombre: 'Ultra 2 (2025)',
                                año: 2025,
                                modelos: [
                                    { id: 'ultra9-285k', nombre: 'Ultra 9 285K' }
                                ]
                            },
                            {
                                id: '14gen-i9-desktop',
                                nombre: '14ª Gen (Raptor Lake Refresh)',
                                año: 2024,
                                modelos: [
                                    { id: 'i9-14900ks', nombre: 'i9-14900KS' },
                                    { id: 'i9-14900k', nombre: 'i9-14900K' },
                                    { id: 'i9-14900kf', nombre: 'i9-14900KF' }
                                ]
                            },
                            {
                                id: '13gen-i9-desktop',
                                nombre: '13ª Gen (Raptor Lake)',
                                año: 2023,
                                modelos: [
                                    { id: 'i9-13900k', nombre: 'i9-13900K' },
                                    { id: 'i9-13900f', nombre: 'i9-13900F' }
                                ]
                            },
                            {
                                id: '12gen-i9-desktop',
                                nombre: '12ª Gen (Alder Lake)',
                                año: 2022,
                                modelos: [
                                    { id: 'i9-12900k', nombre: 'i9-12900K' }
                                ]
                            },
                            {
                                id: '11gen-i9-desktop',
                                nombre: '11ª Gen',
                                año: 2021,
                                modelos: [
                                    { id: 'i9-11900k', nombre: 'i9-11900K' }
                                ]
                            },
                            {
                                id: '10gen-i9-desktop',
                                nombre: '10ª Gen',
                                año: 2020,
                                modelos: [
                                    { id: 'i9-10900k', nombre: 'i9-10900K' }
                                ]
                            },
                            {
                                id: '9gen-i9-desktop',
                                nombre: '9ª Gen',
                                año: 2019,
                                modelos: [
                                    { id: 'i9-9900k', nombre: 'i9-9900K' }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'core-i7-ultra7-desktop',
                        nombre: 'Core i7 / Ultra 7',
                        descripcion: 'Gama Alta / Gaming Pro',
                        generaciones: [
                            {
                                id: 'ultra2-i7-desktop',
                                nombre: 'Ultra 2 (2025)',
                                año: 2025,
                                modelos: [
                                    { id: 'ultra7-265k', nombre: 'Ultra 7 265K' }
                                ]
                            },
                            {
                                id: '14gen-i7-desktop',
                                nombre: '14ª Gen',
                                año: 2024,
                                modelos: [
                                    { id: 'i7-14700k', nombre: 'i7-14700K' },
                                    { id: 'i7-14700f', nombre: 'i7-14700F' }
                                ]
                            },
                            {
                                id: '13gen-i7-desktop',
                                nombre: '13ª Gen',
                                año: 2023,
                                modelos: [
                                    { id: 'i7-13700k', nombre: 'i7-13700K' }
                                ]
                            },
                            {
                                id: '12gen-i7-desktop',
                                nombre: '12ª Gen',
                                año: 2022,
                                modelos: [
                                    { id: 'i7-12700k', nombre: 'i7-12700K' },
                                    { id: 'i7-12500', nombre: 'i7-12500' },
                                ]
                            },
                            {
                                id: '11gen-i7-desktop',
                                nombre: '11ª Gen',
                                año: 2021,
                                modelos: [
                                    { id: 'i7-11700k', nombre: 'i7-11700K' }
                                ]
                            },
                            {
                                id: '10gen-i7-desktop',
                                nombre: '10ª Gen',
                                año: 2020,
                                modelos: [
                                    { id: 'i7-10700k', nombre: 'i7-10700K' }
                                ]
                            },
                            {
                                id: '9gen-i7-desktop',
                                nombre: '9ª Gen',
                                año: 2019,
                                modelos: [
                                    { id: 'i7-9700k', nombre: 'i7-9700K' }
                                ]
                            },
                            {
                                id: '8gen-i7-desktop',
                                nombre: '8ª Gen',
                                año: 2018,
                                modelos: [
                                    { id: 'i7-8700k', nombre: 'i7-8700K' }
                                ]
                            },
                            {
                                id: '4gen-i7-desktop',
                                nombre: '4ª Gen',
                                año: 2013,
                                modelos: [
                                    { id: 'i7-4770k', nombre: 'i7-4770K' }
                                ]
                            },
                            {
                                id: '3gen-i7-desktop',
                                nombre: '3ª Gen',
                                año: 2012,
                                modelos: [
                                    { id: 'i7-3770', nombre: 'i7-3770' }
                                ]
                            },
                            {
                                id: '2gen-i7-desktop',
                                nombre: '2ª Gen',
                                año: 2011,
                                modelos: [
                                    { id: 'i7-2600', nombre: 'i7-2600' }
                                ]
                            },
                            {
                                id: '1gen-i7-desktop',
                                nombre: '1ª Gen',
                                año: 2009,
                                modelos: [
                                    { id: 'i7-920', nombre: 'i7-920' }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'core-i5-ultra5-desktop',
                        nombre: 'Core i5 / Ultra 5',
                        descripcion: 'Gama Media / Calidad-Precio',
                        generaciones: [
                            {
                                id: 'ultra2-i5-desktop',
                                nombre: 'Ultra 2 (2025)',
                                año: 2025,
                                modelos: [
                                    { id: 'ultra5-245k', nombre: 'Ultra 5 245K' }
                                ]
                            },
                            {
                                id: '14gen-i5-desktop',
                                nombre: '14ª Gen',
                                año: 2024,
                                modelos: [
                                    { id: 'i5-14600k', nombre: 'i5-14600K' },
                                    { id: 'i5-14400f', nombre: 'i5-14400F' }
                                ]
                            },
                            {
                                id: '13gen-i5-desktop',
                                nombre: '13ª Gen',
                                año: 2023,
                                modelos: [
                                    { id: 'i5-13600k', nombre: 'i5-13600K' },
                                    { id: 'i5-13400f', nombre: 'i5-13400F' }
                                ]
                            },
                            {
                                id: '12gen-i5-desktop',
                                nombre: '12ª Gen',
                                año: 2022,
                                modelos: [
                                    { id: 'i5-12600k', nombre: 'i5-12600K' },
                                    { id: 'i5-12500t', nombre: 'i5-12500T' },
                                    { id: 'i5-12500', nombre: 'i5-12500' },
                                    { id: 'i5-12400f', nombre: 'i5-12400F' },
                                ]
                            },
                            {
                                id: '11gen-i5-desktop',
                                nombre: '11ª Gen',
                                año: 2021,
                                modelos: [
                                    { id: 'i5-11400f', nombre: 'i5-11400F' }
                                ]
                            },
                            {
                                id: '10gen-i5-desktop',
                                nombre: '10ª Gen',
                                año: 2020,
                                modelos: [
                                    { id: 'i5-10400f', nombre: 'i5-10400F' }
                                ]
                            },
                            {
                                id: '9gen-i5-desktop',
                                nombre: '9ª Gen',
                                año: 2019,
                                modelos: [
                                    { id: 'i5-9400f', nombre: 'i5-9400F' }
                                ]
                            },
                            {
                                id: '8gen-i5-desktop',
                                nombre: '8ª Gen',
                                año: 2018,
                                modelos: [
                                    { id: 'i5-8400', nombre: 'i5-8400' }
                                ]
                            },
                            {
                                id: '6gen-i5-desktop',
                                nombre: '6ª Gen',
                                año: 2015,
                                modelos: [
                                    { id: 'i5-6500', nombre: 'i5-6500' }
                                ]
                            },
                            {
                                id: '4gen-i5-desktop',
                                nombre: '4ª Gen',
                                año: 2013,
                                modelos: [
                                    { id: 'i5-4460', nombre: 'i5-4460' }
                                ]
                            },
                            {
                                id: '3gen-i5-desktop',
                                nombre: '3ª Gen',
                                año: 2012,
                                modelos: [
                                    { id: 'i5-3470', nombre: 'i5-3470' }
                                ]
                            },
                            {
                                id: '2gen-i5-desktop',
                                nombre: '2ª Gen',
                                año: 2011,
                                modelos: [
                                    { id: 'i5-2500', nombre: 'i5-2500' }
                                ]
                            },
                            {
                                id: '1gen-i5-desktop',
                                nombre: '1ª Gen',
                                año: 2009,
                                modelos: [
                                    { id: 'i5-750', nombre: 'i5-750' }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'core-i3-core3-desktop',
                        nombre: 'Core i3 / Core 3',
                        descripcion: 'Gama Entrada / Oficina',
                        generaciones: [
                            {
                                id: '14gen-i3-desktop',
                                nombre: '14ª Gen',
                                año: 2024,
                                modelos: [
                                    { id: 'i3-14100', nombre: 'i3-14100' }
                                ]
                            },
                            {
                                id: '13gen-i3-desktop',
                                nombre: '13ª Gen',
                                año: 2023,
                                modelos: [
                                    { id: 'i3-13100', nombre: 'i3-13100' }
                                ]
                            },
                            {
                                id: '12gen-i3-desktop',
                                nombre: '12ª Gen',
                                año: 2022,
                                modelos: [
                                    { id: 'i3-12100', nombre: 'i3-12100' }
                                ]
                            },
                            {
                                id: '10gen-i3-desktop',
                                nombre: '10ª Gen',
                                año: 2020,
                                modelos: [
                                    { id: 'i3-10100', nombre: 'i3-10100' }
                                ]
                            },
                            {
                                id: '9gen-i3-desktop',
                                nombre: '9ª Gen',
                                año: 2019,
                                modelos: [
                                    { id: 'i3-9100', nombre: 'i3-9100' }
                                ]
                            },
                            {
                                id: '8gen-i3-desktop',
                                nombre: '8ª Gen',
                                año: 2018,
                                modelos: [
                                    { id: 'i3-8100', nombre: 'i3-8100' }
                                ]
                            },
                            {
                                id: '6gen-i3-desktop',
                                nombre: '6ª Gen',
                                año: 2015,
                                modelos: [
                                    { id: 'i3-6100', nombre: 'i3-6100' }
                                ]
                            },
                            {
                                id: '4gen-i3-desktop',
                                nombre: '4ª Gen',
                                año: 2013,
                                modelos: [
                                    { id: 'i3-4130', nombre: 'i3-4130' }
                                ]
                            },
                            {
                                id: '2gen-i3-desktop',
                                nombre: '2ª Gen',
                                año: 2011,
                                modelos: [
                                    { id: 'i3-2100', nombre: 'i3-2100' }
                                ]
                            },
                            {
                                id: '1gen-i3-desktop',
                                nombre: '1ª Gen',
                                año: 2010,
                                modelos: [
                                    { id: 'i3-530', nombre: 'i3-530' }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'economicos-desktop',
                        nombre: 'Económicos (Celeron, Pentium)',
                        descripcion: 'PC muy básico',
                        generaciones: [
                            {
                                id: 'pentium-desktop',
                                nombre: 'Pentium Gold',
                                modelos: [
                                    { id: 'g7400', nombre: 'Pentium Gold G7400' },
                                    { id: 'g6405', nombre: 'Pentium Gold G6405' },
                                    { id: 'g5400', nombre: 'Pentium Gold G5400' }
                                ]
                            },
                            {
                                id: 'celeron-desktop',
                                nombre: 'Celeron',
                                modelos: [
                                    { id: 'g5905', nombre: 'Celeron G5905' }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                id: 'amd-desktop',
                nombre: 'AMD',
                familias: [
                    {
                        id: 'ryzen-9-desktop',
                        nombre: 'Ryzen 9',
                        descripcion: 'La Elite AMD',
                        generaciones: [
                            {
                                id: 'ryzen9-9000-desktop',
                                nombre: 'Serie 9000 (Zen 5)',
                                año: 2024,
                                modelos: [
                                    { id: 'r9-9950x', nombre: 'Ryzen 9 9950X' },
                                    { id: 'r9-9900x', nombre: 'Ryzen 9 9900X' }
                                ]
                            },
                            {
                                id: 'ryzen9-7000-desktop',
                                nombre: 'Serie 7000 (Zen 4)',
                                año: 2023,
                                modelos: [
                                    { id: 'r9-7950x3d', nombre: 'Ryzen 9 7950X3D' },
                                    { id: 'r9-7950x', nombre: 'Ryzen 9 7950X' },
                                    { id: 'r9-7900x', nombre: 'Ryzen 9 7900X' }
                                ]
                            },
                            {
                                id: 'ryzen9-5000-desktop',
                                nombre: 'Serie 5000 (Zen 3)',
                                año: 2021,
                                modelos: [
                                    { id: 'r9-5950x', nombre: 'Ryzen 9 5950X' },
                                    { id: 'r9-5900x', nombre: 'Ryzen 9 5900X' }
                                ]
                            },
                            {
                                id: 'ryzen9-3000-desktop',
                                nombre: 'Serie 3000 (Zen 2)',
                                año: 2019,
                                modelos: [
                                    { id: 'r9-3950x', nombre: 'Ryzen 9 3950X' },
                                    { id: 'r9-3900x', nombre: 'Ryzen 9 3900X' }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'ryzen-7-desktop',
                        nombre: 'Ryzen 7',
                        descripcion: 'Gaming y Productividad',
                        generaciones: [
                            {
                                id: 'ryzen7-9000-desktop',
                                nombre: 'Serie 9000 (Zen 5)',
                                año: 2024,
                                modelos: [
                                    { id: 'r7-9700x', nombre: 'Ryzen 7 9700X' }
                                ]
                            },
                            {
                                id: 'ryzen7-7000-desktop',
                                nombre: 'Serie 7000 (Zen 4)',
                                año: 2023,
                                modelos: [
                                    { id: 'r7-7800x3d', nombre: 'Ryzen 7 7800X3D' },
                                    { id: 'r7-7700x', nombre: 'Ryzen 7 7700X' }
                                ]
                            },
                            {
                                id: 'ryzen7-5000-desktop',
                                nombre: 'Serie 5000 (Zen 3)',
                                año: 2021,
                                modelos: [
                                    { id: 'r7-5800x3d', nombre: 'Ryzen 7 5800X3D' },
                                    { id: 'r7-5800x', nombre: 'Ryzen 7 5800X' },
                                    { id: 'r7-5700x', nombre: 'Ryzen 7 5700X' }
                                ]
                            },
                            {
                                id: 'ryzen7-3000-desktop',
                                nombre: 'Serie 3000 (Zen 2)',
                                año: 2019,
                                modelos: [
                                    { id: 'r7-3700x', nombre: 'Ryzen 7 3700X' }
                                ]
                            },
                            {
                                id: 'ryzen7-2000-desktop',
                                nombre: 'Serie 2000 (Zen+)',
                                año: 2018,
                                modelos: [
                                    { id: 'r7-2700x', nombre: 'Ryzen 7 2700X' }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'ryzen-5-desktop',
                        nombre: 'Ryzen 5',
                        descripcion: 'Más Vendido en mercado común',
                        generaciones: [
                            {
                                id: 'ryzen5-9000-desktop',
                                nombre: 'Serie 9000 (Zen 5)',
                                año: 2024,
                                modelos: [
                                    { id: 'r5-9600x', nombre: 'Ryzen 5 9600X' }
                                ]
                            },
                            {
                                id: 'ryzen5-7000-desktop',
                                nombre: 'Serie 7000 (Zen 4)',
                                año: 2023,
                                modelos: [
                                    { id: 'r5-7600x', nombre: 'Ryzen 5 7600X' }
                                ]
                            },
                            {
                                id: 'ryzen5-5000-desktop',
                                nombre: 'Serie 5000 (Zen 3)',
                                año: 2021,
                                modelos: [
                                    { id: 'r5-5600x', nombre: 'Ryzen 5 5600X' },
                                    { id: 'r5-5600', nombre: 'Ryzen 5 5600' }
                                ]
                            },
                            {
                                id: 'ryzen5-3000-desktop',
                                nombre: 'Serie 3000 (Zen 2)',
                                año: 2019,
                                modelos: [
                                    { id: 'r5-3600', nombre: 'Ryzen 5 3600' }
                                ]
                            },
                            {
                                id: 'ryzen5-2000-desktop',
                                nombre: 'Serie 2000 (Zen+)',
                                año: 2018,
                                modelos: [
                                    { id: 'r5-2600', nombre: 'Ryzen 5 2600' }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'ryzen-3-desktop',
                        nombre: 'Ryzen 3',
                        descripcion: 'Entrada Decente',
                        generaciones: [
                            {
                                id: 'ryzen3-3000-desktop',
                                nombre: 'Serie 3000 (Zen 2)',
                                año: 2019,
                                modelos: [
                                    { id: 'r3-3300x', nombre: 'Ryzen 3 3300X' },
                                    { id: 'r3-3100', nombre: 'Ryzen 3 3100' }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'threadripper-desktop',
                        nombre: 'Threadripper',
                        descripcion: 'Workstation Extrema',
                        generaciones: [
                            {
                                id: 'threadripper-7000-desktop',
                                nombre: 'Serie 7000 (Zen 4)',
                                año: 2023,
                                modelos: [
                                    { id: 'tr-7980x', nombre: 'Threadripper 7980X' },
                                    { id: 'tr-7970x', nombre: 'Threadripper 7970X' }
                                ]
                            },
                            {
                                id: 'threadripper-5000-desktop',
                                nombre: 'Serie 5000 (Zen 3)',
                                año: 2022,
                                modelos: [
                                    { id: 'tr-5995wx', nombre: 'Threadripper PRO 5995WX' }
                                ]
                            },
                            {
                                id: 'threadripper-3000-desktop',
                                nombre: 'Serie 3000 (Zen 2)',
                                año: 2019,
                                modelos: [
                                    { id: 'tr-3990x', nombre: 'Threadripper 3990X' },
                                    { id: 'tr-3970x', nombre: 'Threadripper 3970X' }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    },

    {
        id: 'aio',
        tipo: 'AIO',
        marcas: [
            {
                id: 'intel-aio',
                nombre: 'Intel',
                familias: [
                    {
                        id: 'core-i7-aio',
                        nombre: 'Core i7 / Ultra 7',
                        descripcion: 'Lo más común en AIOs de gama alta',
                        generaciones: [
                            {
                                id: '13gen-i7-aio',
                                nombre: '13ª Gen',
                                año: 2023,
                                modelos: [
                                    { id: 'i7-13700-aio', nombre: 'i7-13700' }
                                ]
                            },
                            {
                                id: '12gen-i7-aio',
                                nombre: '12ª Gen',
                                año: 2022,
                                modelos: [
                                    { id: 'i7-12700-aio', nombre: 'i7-12700' }
                                ]
                            },
                            {
                                id: '11gen-i7-aio',
                                nombre: '11ª Gen',
                                año: 2021,
                                modelos: [
                                    { id: 'i7-11700-aio', nombre: 'i7-11700' }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'core-i5-aio',
                        nombre: 'Core i5',
                        descripcion: 'El común en AIOs',
                        generaciones: [
                            {
                                id: '13gen-i5-aio',
                                nombre: '13ª Gen',
                                año: 2023,
                                modelos: [
                                    { id: 'i5-13400-aio', nombre: 'i5-13400' }
                                ]
                            },
                            {
                                id: '12gen-i5-aio',
                                nombre: '12ª Gen',
                                año: 2022,
                                modelos: [
                                    { id: 'i5-12400-aio', nombre: 'i5-12400' }
                                ]
                            },
                            {
                                id: '11gen-i5-aio',
                                nombre: '11ª Gen',
                                año: 2021,
                                modelos: [
                                    { id: 'i5-11400-aio', nombre: 'i5-11400' }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'core-i3-aio',
                        nombre: 'Core i3',
                        descripcion: 'AIOs básicos',
                        generaciones: [
                            {
                                id: '12gen-i3-aio',
                                nombre: '12ª Gen',
                                año: 2022,
                                modelos: [
                                    { id: 'i3-12100-aio', nombre: 'i3-12100' }
                                ]
                            },
                            {
                                id: '10gen-i3-aio',
                                nombre: '10ª Gen',
                                año: 2020,
                                modelos: [
                                    { id: 'i3-10100-aio', nombre: 'i3-10100' }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'economicos-aio',
                        nombre: 'Económicos (Celeron, Pentium)',
                        generaciones: [
                            {
                                id: 'pentium-aio',
                                nombre: 'Pentium',
                                modelos: [
                                    { id: 'pentium-g6405-aio', nombre: 'Pentium Gold G6405' }
                                ]
                            },
                            {
                                id: 'celeron-aio',
                                nombre: 'Celeron',
                                modelos: [
                                    { id: 'celeron-g5905-aio', nombre: 'Celeron G5905' }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                id: 'amd-aio',
                nombre: 'AMD',
                familias: [
                    {
                        id: 'ryzen-7-aio',
                        nombre: 'Ryzen 7',
                        generaciones: [
                            {
                                id: 'ryzen7-5000-aio',
                                nombre: 'Serie 5000G (Zen 3)',
                                año: 2021,
                                modelos: [
                                    { id: 'r7-5700g-aio', nombre: 'Ryzen 7 5700G' }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'ryzen-5-aio',
                        nombre: 'Ryzen 5',
                        generaciones: [
                            {
                                id: 'ryzen5-5000-aio',
                                nombre: 'Serie 5000G (Zen 3)',
                                año: 2021,
                                modelos: [
                                    { id: 'r5-5600g-aio', nombre: 'Ryzen 5 5600G' }
                                ]
                            },
                            {
                                id: 'ryzen5-4000-aio',
                                nombre: 'Serie 4000G (Zen 2)',
                                año: 2020,
                                modelos: [
                                    { id: 'r5-4600g-aio', nombre: 'Ryzen 5 4600G' }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'ryzen-3-aio',
                        nombre: 'Ryzen 3',
                        generaciones: [
                            {
                                id: 'ryzen3-4000-aio',
                                nombre: 'Serie 4000G (Zen 2)',
                                año: 2020,
                                modelos: [
                                    { id: 'r3-4300g-aio', nombre: 'Ryzen 3 4300G' }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    }
];

export const getMarcasPorDispositivo = (tipoDispositivo: TipoDispositivo): MarcaData[] => {
    const dispositivo = PROCESADORES_DATA.find(d => d.tipo === tipoDispositivo);
    return dispositivo?.marcas || [];
};

export const getFamiliasPorMarcaYDispositivo = (
    tipoDispositivo: TipoDispositivo,
    marca: MarcaProcesador
): FamiliaProcesador[] => {
    const dispositivo = PROCESADORES_DATA.find(d => d.tipo === tipoDispositivo);
    const marcaData = dispositivo?.marcas.find(m => m.nombre === marca);
    return marcaData?.familias || [];
};

export const getGeneracionesPorFamilia = (
    tipoDispositivo: TipoDispositivo,
    marca: MarcaProcesador,
    familiaId: string
): Generacion[] => {
    const dispositivo = PROCESADORES_DATA.find(d => d.tipo === tipoDispositivo);
    const marcaData = dispositivo?.marcas.find(m => m.nombre === marca);
    const familia = marcaData?.familias.find(f => f.id === familiaId);
    return familia?.generaciones || [];
};

export const getModelosPorGeneracion = (
    tipoDispositivo: TipoDispositivo,
    marca: MarcaProcesador,
    familiaId: string,
    generacionId: string
): ModeloProcesador[] => {
    const dispositivo = PROCESADORES_DATA.find(d => d.tipo === tipoDispositivo);
    const marcaData = dispositivo?.marcas.find(m => m.nombre === marca);
    const familia = marcaData?.familias.find(f => f.id === familiaId);
    const generacion = familia?.generaciones.find(g => g.id === generacionId);
    return generacion?.modelos || [];
};


export const MarcaProcesadores: MarcaProcesador[] = ['Intel', 'AMD'];
export const TiposDispositivo: TipoDispositivo[] = ['Notebook', 'AIO', 'Desktop'];