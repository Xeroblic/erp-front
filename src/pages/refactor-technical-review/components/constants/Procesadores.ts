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
                id: 'intel-notebook', nombre: 'Intel',
                familias: [
                    {
                    id: 'core-i9-notebook', nombre: 'Core i9', descripcion: 'La Elite / Streaming / Render',
                    generaciones: [
                        { id: '14gen-i9-notebook', nombre: '14ª Gen', año: 2024, modelos: [{id: 'i9-14900hx', nombre: 'i9-14900HX'}] },
                        { id: '13gen-i9-notebook', nombre: '13ª Gen', año: 2023, modelos: [{id: 'i9-13980hx', nombre: 'i9-13980HX'}, {id: 'i9-13950hx', nombre: 'i9-13950HX'}, {id: 'i9-13900hx', nombre: 'i9-13900HX'}, {id: 'i9-13900hk', nombre: 'i9-13900HK'}, {id: 'i9-13900h', nombre: 'i9-13900H'}] },
                        { id: '12gen-i9-notebook', nombre: '12ª Gen', año: 2022, modelos: [{id: 'i9-12950hx', nombre: 'i9-12950HX'}, {id: 'i9-12900hx', nombre: 'i9-12900HX'}, {id: 'i9-12900hk', nombre: 'i9-12900HK'}, {id: 'i9-12900h', nombre: 'i9-12900H'}] },
                        { id: '11gen-i9-notebook', nombre: '11ª Gen', año: 2021, modelos: [{id: 'i9-11980hk', nombre: 'i9-11980HK'}, {id: 'i9-11950h', nombre: 'i9-11950H'}, {id: 'i9-11900h', nombre: 'i9-11900H'}] },
                        { id: '10gen-i9-notebook', nombre: '10ª Gen', año: 2020, modelos: [{id: 'i9-10980hk', nombre: 'i9-10980HK'}, {id: 'i9-10885h', nombre: 'i9-10885H'}, {id: 'i9-10880h', nombre: 'i9-10880H'}] },
                        { id: '9gen-i9-notebook', nombre: '9ª Gen', año: 2019, modelos: [{id: 'i9-9980hk', nombre: 'i9-9980HK'}, {id: 'i9-9880h', nombre: 'i9-9880H'}] },
                        { id: '8gen-i9-notebook', nombre: '8ª Gen', año: 2018, modelos: [{id: 'i9-8950hk', nombre: 'i9-8950HK'}] }
                    ]
                    },
                    {
                    id: 'core-i7-notebook', nombre: 'Core i7', descripcion: 'Gama Alta / Gaming Pro',
                    generaciones: [
                        { id: '14gen-i7-notebook', nombre: '14ª Gen', año: 2024, modelos: [{id: 'i7-14700hx', nombre: 'i7-14700HX'}, {id: 'i7-14650hx', nombre: 'i7-14650HX'}] },
                        { id: '13gen-i7-notebook', nombre: '13ª Gen', año: 2023, modelos: [{id: 'i7-13850hx', nombre: 'i7-13850HX'}, {id: 'i7-13700hx', nombre: 'i7-13700HX'}, {id: 'i7-13700h', nombre: 'i7-13700H'}, {id: 'i7-13620h', nombre: 'i7-13620H'}, {id: 'i7-1360p', nombre: 'i7-1360P'}, {id: 'i7-1355u', nombre: 'i7-1355U'}] },
                        { id: '12gen-i7-notebook', nombre: '12ª Gen', año: 2022, modelos: [{id: 'i7-12800hx', nombre: 'i7-12800HX'}, {id: 'i7-12700h', nombre: 'i7-12700H'}, {id: 'i7-12650h', nombre: 'i7-12650H'}, {id: 'i7-1260p', nombre: 'i7-1260P'}, {id: 'i7-1255u', nombre: 'i7-1255U'}] },
                        { id: '11gen-i7-notebook', nombre: '11ª Gen', año: 2021, modelos: [{id: 'i7-11800h', nombre: 'i7-11800H'}, {id: 'i7-11370h', nombre: 'i7-11370H'}, {id: 'i7-1165g7', nombre: 'i7-1165G7'}, {id: 'i7-1185g7', nombre: 'i7-1185G7'}] },
                        { id: '10gen-i7-notebook', nombre: '10ª Gen', año: 2020, modelos: [{id: 'i7-10875h', nombre: 'i7-10875H'}, {id: 'i7-10750h', nombre: 'i7-10750H'}, {id: 'i7-1065g7', nombre: 'i7-1065G7'}, {id: 'i7-10510u', nombre: 'i7-10510U'}] },
                        { id: '9gen-i7-notebook', nombre: '9ª Gen', año: 2019, modelos: [{id: 'i7-9850h', nombre: 'i7-9850H'}, {id: 'i7-9750h', nombre: 'i7-9750H'}] },
                        { id: '8gen-i7-notebook', nombre: '8ª Gen', año: 2018, modelos: [{id: 'i7-8850h', nombre: 'i7-8850H'}, {id: 'i7-8750h', nombre: 'i7-8750H'}, {id: 'i7-8650u', nombre: 'i7-8650U'}, {id: 'i7-8550u', nombre: 'i7-8550U'}, {id: 'i7-8565u', nombre: 'i7-8565U'}] }
                    ]
                    },
                    {
                    id: 'core-i5-notebook', nombre: 'Core i5', descripcion: 'Gama Media',
                    generaciones: [
                        { id: '14gen-i5-notebook', nombre: '14ª Gen', año: 2024, modelos: [{id: 'i5-14500hx', nombre: 'i5-14500HX'}, {id: 'i5-14450hx', nombre: 'i5-14450HX'}] },
                        { id: '13gen-i5-notebook', nombre: '13ª Gen', año: 2023, modelos: [{id: 'i5-13500hx', nombre: 'i5-13500HX'}, {id: 'i5-13450hx', nombre: 'i5-13450HX'}, {id: 'i5-13500h', nombre: 'i5-13500H'}, {id: 'i5-13420h', nombre: 'i5-13420H'}, {id: 'i5-1340p', nombre: 'i5-1340P'}, {id: 'i5-1335u', nombre: 'i5-1335U'}] },
                        { id: '12gen-i5-notebook', nombre: '12ª Gen', año: 2022, modelos: [{id: 'i5-12600h', nombre: 'i5-12600H'}, {id: 'i5-12500h', nombre: 'i5-12500H'}, {id: 'i5-12450h', nombre: 'i5-12450H'}, {id: 'i5-1240p', nombre: 'i5-1240P'}, {id: 'i5-1235u', nombre: 'i5-1235U'}] },
                        { id: '11gen-i5-notebook', nombre: '11ª Gen', año: 2021, modelos: [{id: 'i5-11500h', nombre: 'i5-11500H'}, {id: 'i5-11400h', nombre: 'i5-11400H'}, {id: 'i5-11320h', nombre: 'i5-11320H'}, {id: 'i5-11300h', nombre: 'i5-11300H'}, {id: 'i5-1135g7', nombre: 'i5-1135G7'}, {id: 'i5-1145g7', nombre: 'i5-1145G7'}] },
                        { id: '10gen-i5-notebook', nombre: '10ª Gen', año: 2020, modelos: [{id: 'i5-10400h', nombre: 'i5-10400H'}, {id: 'i5-10300h', nombre: 'i5-10300H'}, {id: 'i5-1035g7', nombre: 'i5-1035G7'}, {id: 'i5-1035g1', nombre: 'i5-1035G1'}, {id: 'i5-10210u', nombre: 'i5-10210U'}] },
                        { id: '9gen-i5-notebook', nombre: '9ª Gen', año: 2019, modelos: [{id: 'i5-9400h', nombre: 'i5-9400H'}, {id: 'i5-9300h', nombre: 'i5-9300H'}] },
                        { id: '8gen-i5-notebook', nombre: '8ª Gen', año: 2018, modelos: [{id: 'i5-8400h', nombre: 'i5-8400H'}, {id: 'i5-8300h', nombre: 'i5-8300H'}, {id: 'i5-8265u', nombre: 'i5-8265U'}, {id: 'i5-8250u', nombre: 'i5-8250U'}] }
                    ]
                    },
                    {
                    id: 'core-i3-notebook', nombre: 'Core i3', descripcion: 'Gama Entrada',
                    generaciones: [
                        { id: '13gen-i3-notebook', nombre: '13ª Gen', año: 2023, modelos: [{id: 'i3-1315u', nombre: 'i3-1315U'}, {id: 'i3-1305u', nombre: 'i3-1305U'}] },
                        { id: '12gen-i3-notebook', nombre: '12ª Gen', año: 2022, modelos: [{id: 'i3-1215u', nombre: 'i3-1215U'}, {id: 'i3-1220p', nombre: 'i3-1220P'}] },
                        { id: '11gen-i3-notebook', nombre: '11ª Gen', año: 2021, modelos: [{id: 'i3-1115g4', nombre: 'i3-1115G4'}, {id: 'i3-1125g4', nombre: 'i3-1125G4'}] },
                        { id: '10gen-i3-notebook', nombre: '10ª Gen', año: 2020, modelos: [{id: 'i3-10110u', nombre: 'i3-10110U'}, {id: 'i3-1005g1', nombre: 'i3-1005G1'}] },
                        { id: '8gen-i3-notebook', nombre: '8ª Gen', año: 2018, modelos: [{id: 'i3-8145u', nombre: 'i3-8145U'}, {id: 'i3-8130u', nombre: 'i3-8130U'}] }
                    ]
                    },
                    {
                    id: 'economicos-notebook', nombre: 'Económicos', descripcion: 'Uso básico',
                    generaciones: [
                        { id: 'nseries-notebook', nombre: 'Intel Processor N-Series', modelos: [{id: 'n200', nombre: 'Intel N200'}, {id: 'n100', nombre: 'Intel N100'}, {id: 'n95', nombre: 'Intel N95'}] },
                        { id: 'pentium-notebook', nombre: 'Pentium Gold/Silver', modelos: [{id: 'pentium-8505', nombre: 'Pentium 8505'}, {id: 'n6000', nombre: 'Pentium Silver N6000'}, {id: 'n5030', nombre: 'Pentium Silver N5030'}, {id: 'gold-7505', nombre: 'Pentium Gold 7505'}] },
                        { id: 'celeron-notebook', nombre: 'Celeron', modelos: [{id: 'celeron-7305', nombre: 'Celeron 7305'}, {id: 'n5100', nombre: 'Celeron N5100'}, {id: 'n4500', nombre: 'Celeron N4500'}, {id: 'n4020', nombre: 'Celeron N4020'}, {id: 'j4125', nombre: 'Celeron J4125'}] }
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
                    descripcion: 'La Elite AMD',
                    generaciones: [
                        { id: 'r9-8000', nombre: 'Serie 8000 Zen 4', año: 2024, modelos: [{ id: 'r9-8945hs', nombre: 'Ryzen 9 8945HS' }, { id: 'r9-8940hs', nombre: 'Ryzen 9 8940HS' }] },
                        { id: 'r9-7000', nombre: 'Serie 7000 Zen 4', año: 2023, modelos: [{ id: 'r9-7945hx3d', nombre: 'Ryzen 9 7945HX3D' }, { id: 'r9-7945hx', nombre: 'Ryzen 9 7945HX' }] },
                        { id: 'r9-6000', nombre: 'Serie 6000 Zen 3+', año: 2022, modelos: [{ id: 'r9-6980hx', nombre: 'Ryzen 9 6980HX' }, { id: 'r9-6900hx', nombre: 'Ryzen 9 6900HX' }] },
                        { id: 'r9-5000', nombre: 'Serie 5000 Zen 3', año: 2021, modelos: [{ id: 'r9-5900hx', nombre: 'Ryzen 9 5900HX' }, { id: 'r9-5900hs', nombre: 'Ryzen 9 5900HS' }] }
                    ]
                    },
                    {
                    id: 'ryzen-7-notebook',
                    nombre: 'Ryzen 7',
                    descripcion: 'Gaming y Creacion',
                    generaciones: [
                        { id: 'r7-8000', nombre: 'Serie 8000 Zen 4', año: 2024, modelos: [{ id: 'r7-8845hs', nombre: 'Ryzen 7 8845HS' }, { id: 'r7-8840u', nombre: 'Ryzen 7 8840U' }] },
                        { id: 'r7-7000', nombre: 'Serie 7000 Zen 4 y 3', año: 2023, modelos: [{ id: 'r7-7840hs', nombre: 'Ryzen 7 7840HS' }, { id: 'r7-7735hs', nombre: 'Ryzen 7 7735HS' }] },
                        { id: 'r7-6000', nombre: 'Serie 6000 Zen 3+', año: 2022, modelos: [{ id: 'r7-6800h', nombre: 'Ryzen 7 6800H' }, { id: 'r7-6800u', nombre: 'Ryzen 7 6800U' }] },
                        { id: 'r7-5000', nombre: 'Serie 5000 Zen 3', año: 2021, modelos: [{ id: 'r7-5800h', nombre: 'Ryzen 7 5800H' }, { id: 'r7-5800u', nombre: 'Ryzen 7 5800U' }] },
                        { id: 'r7-4000', nombre: 'Serie 4000 Zen 2', año: 2020, modelos: [{ id: 'r7-4800h', nombre: 'Ryzen 7 4800H' }, { id: 'r7-4700u', nombre: 'Ryzen 7 4700U' }] },
                        { id: 'r7-3000', nombre: 'Serie 3000 Zen Plus', año: 2019, modelos: [{ id: 'r7-3750h', nombre: 'Ryzen 7 3750H' }, { id: 'r7-3700u', nombre: 'Ryzen 7 3700U' }] }
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
                id: 'intel-desktop', nombre: 'Intel',
                familias: [
                    {
                    id: 'core-i9-desktop', nombre: 'Core i9', descripcion: 'La Elite / Streaming / Render',
                    generaciones: [
                        { id: '14gen-i9', nombre: '14ª Gen', modelos: [{id: 'i9-14900k', nombre: 'i9-14900K'}] },
                        { id: '13gen-i9', nombre: '13ª Gen', modelos: [{id: 'i9-13900k', nombre: 'i9-13900K'}] },
                        { id: '12gen-i9', nombre: '12ª Gen', modelos: [{id: 'i9-12900k', nombre: 'i9-12900K'}] },
                        { id: '11gen-i9', nombre: '11ª Gen', modelos: [{id: 'i9-11900k', nombre: 'i9-11900K'}] },
                        { id: '10gen-i9', nombre: '10ª Gen', modelos: [{id: 'i9-10900k', nombre: 'i9-10900K'}] },
                        { id: '9gen-i9', nombre: '9ª Gen', modelos: [{id: 'i9-9900k', nombre: 'i9-9900K'}] }
                    ]
                    },
                    {
                    id: 'core-i7-desktop', nombre: 'Core i7', descripcion: 'Gama Alta / Gaming Pro',
                    generaciones: [
                        { id: '14gen-i7', nombre: '14ª Gen', modelos: [{id: 'i7-14700k', nombre: 'i7-14700K'}, {id: 'i7-14700f', nombre: 'i7-14700F'}] },
                        { id: '13gen-i7', nombre: '13ª Gen', modelos: [{id: 'i7-13700k', nombre: 'i7-13700K'}, {id: 'i7-13700f', nombre: 'i7-13700F'}] },
                        { id: '12gen-i7', nombre: '12ª Gen', modelos: [{id: 'i7-12700k', nombre: 'i7-12700K'}, {id: 'i7-12700f', nombre: 'i7-12700F'}] },
                        { id: '11gen-i7', nombre: '11ª Gen', modelos: [{id: 'i7-11700k', nombre: 'i7-11700K'}, {id: 'i7-11700f', nombre: 'i7-11700F'}] },
                        { id: '10gen-i7', nombre: '10ª Gen', modelos: [{id: 'i7-10700k', nombre: 'i7-10700K'}] },
                        { id: '9gen-i7', nombre: '9ª Gen', modelos: [{id: 'i7-9700k', nombre: 'i7-9700K'}] },
                        { id: '8gen-i7', nombre: '8ª Gen', modelos: [{id: 'i7-8700k', nombre: 'i7-8700K'}] }
                    ]
                    },
                    {
                    id: 'core-i5-desktop', nombre: 'Core i5', descripcion: 'Gama Media / Calidad-Precio',
                    generaciones: [
                        { id: '14gen-i5', nombre: '14ª Gen', modelos: [{id: 'i5-14600k', nombre: 'i5-14600K'}, {id: 'i5-14400f', nombre: 'i5-14400F'}] },
                        { id: '13gen-i5', nombre: '13ª Gen', modelos: [{id: 'i5-13600k', nombre: 'i5-13600K'}, {id: 'i5-13400f', nombre: 'i5-13400F'}] },
                        { id: '12gen-i5', nombre: '12ª Gen', modelos: [{id: 'i5-12600k', nombre: 'i5-12600K'}, {id: 'i5-12400f', nombre: 'i5-12400F'}] },
                        { id: '11gen-i5', nombre: '11ª Gen', modelos: [{id: 'i5-11600k', nombre: 'i5-11600K'}, {id: 'i5-11400f', nombre: 'i5-11400F'}] },
                        { id: '10gen-i5', nombre: '10ª Gen', modelos: [{id: 'i5-10400f', nombre: 'i5-10400F'}] },
                        { id: '9gen-i5', nombre: '9ª Gen', modelos: [{id: 'i5-9400f', nombre: 'i5-9400F'}] },
                        { id: '8gen-i5', nombre: '8ª Gen', modelos: [{id: 'i5-8400', nombre: 'i5-8400'}] }
                    ]
                    },
                    {
                    id: 'core-i3-desktop', nombre: 'Core i3', descripcion: 'Gama Entrada / Oficina',
                    generaciones: [
                        { id: '14gen-i3', nombre: '14ª Gen', modelos: [{id: 'i3-14100', nombre: 'i3-14100'}, {id: 'i3-14100f', nombre: 'i3-14100F'}] },
                        { id: '13gen-i3', nombre: '13ª Gen', modelos: [{id: 'i3-13100', nombre: 'i3-13100'}, {id: 'i3-13100f', nombre: 'i3-13100F'}] },
                        { id: '12gen-i3', nombre: '12ª Gen', modelos: [{id: 'i3-12100', nombre: 'i3-12100'}, {id: 'i3-12100f', nombre: 'i3-12100F'}] },
                        { id: '10gen-i3', nombre: '10ª Gen', modelos: [{id: 'i3-10100', nombre: 'i3-10100'}] },
                        { id: '9gen-i3', nombre: '9ª Gen', modelos: [{id: 'i3-9100', nombre: 'i3-9100'}] },
                        { id: '8gen-i3', nombre: '8ª Gen', modelos: [{id: 'i3-8100', nombre: 'i3-8100'}] }
                    ]
                    }
                ]
            },
            {
                id: 'amd-desktop', nombre: 'AMD',
                familias: [
                    {
                    id: 'ryzen-9-desktop', nombre: 'Ryzen 9', descripcion: 'La Elite AMD',
                    generaciones: [
                        { id: 'ryzen9-9000', nombre: 'Serie 9000', modelos: [{id: 'r9-9950x', nombre: 'Ryzen 9 9950X'}, {id: 'r9-9900x', nombre: 'Ryzen 9 9900X'}] },
                        { id: 'ryzen9-7000', nombre: 'Serie 7000', modelos: [{id: 'r9-7950x3d', nombre: 'Ryzen 9 7950X3D'}, {id: 'r9-7950x', nombre: 'Ryzen 9 7950X'}, {id: 'r9-7900x', nombre: 'Ryzen 9 7900X'}] },
                        { id: 'ryzen9-5000', nombre: 'Serie 5000', modelos: [{id: 'r9-5950x', nombre: 'Ryzen 9 5950X'}, {id: 'r9-5900x', nombre: 'Ryzen 9 5900X'}] },
                        { id: 'ryzen9-3000', nombre: 'Serie 3000', modelos: [{id: 'r9-3950x', nombre: 'Ryzen 9 3950X'}, {id: 'r9-3900x', nombre: 'Ryzen 9 3900X'}] }
                    ]
                    },
                    {
                    id: 'ryzen-7-desktop', nombre: 'Ryzen 7', descripcion: 'Gaming y Productividad',
                    generaciones: [
                        { id: 'ryzen7-9000', nombre: 'Serie 9000', modelos: [{id: 'r7-9700x', nombre: 'Ryzen 7 9700X'}] },
                        { id: 'ryzen7-7000', nombre: 'Serie 7000', modelos: [{id: 'r7-7800x3d', nombre: 'Ryzen 7 7800X3D'}, {id: 'r7-7700x', nombre: 'Ryzen 7 7700X'}, {id: 'r7-7700', nombre: 'Ryzen 7 7700'}] },
                        { id: 'ryzen7-5000', nombre: 'Serie 5000', modelos: [{id: 'r7-5800x3d', nombre: 'Ryzen 7 5800X3D'}, {id: 'r7-5800x', nombre: 'Ryzen 7 5800X'}, {id: 'r7-5700x', nombre: 'Ryzen 7 5700X'}] },
                        { id: 'ryzen7-3000', nombre: 'Serie 3000', modelos: [{id: 'r7-3800x', nombre: 'Ryzen 7 3800X'}, {id: 'r7-3700x', nombre: 'Ryzen 7 3700X'}] },
                        { id: 'ryzen7-2000', nombre: 'Serie 2000', modelos: [{id: 'r7-2700x', nombre: 'Ryzen 7 2700X'}, {id: 'r7-2700', nombre: 'Ryzen 7 2700'}] },
                        { id: 'ryzen7-1000', nombre: 'Serie 1000', modelos: [{id: 'r7-1800x', nombre: 'Ryzen 7 1800X'}, {id: 'r7-1700', nombre: 'Ryzen 7 1700'}] }
                    ]
                    },
                    {
                    id: 'ryzen-5-desktop', nombre: 'Ryzen 5', descripcion: 'Mas Vendido en mercado comun',
                    generaciones: [
                        { id: 'ryzen5-9000', nombre: 'Serie 9000', modelos: [{id: 'r5-9600x', nombre: 'Ryzen 5 9600X'}] },
                        { id: 'ryzen5-7000', nombre: 'Serie 7000', modelos: [{id: 'r5-7600x', nombre: 'Ryzen 5 7600X'}, {id: 'r5-7600', nombre: 'Ryzen 5 7600'}] },
                        { id: 'ryzen5-5000', nombre: 'Serie 5000', modelos: [{id: 'r5-5600x', nombre: 'Ryzen 5 5600X'}, {id: 'r5-5600g', nombre: 'Ryzen 5 5600G'}, {id: 'r5-5600', nombre: 'Ryzen 5 5600'}] },
                        { id: 'ryzen5-3000', nombre: 'Serie 3000', modelos: [{id: 'r5-3600x', nombre: 'Ryzen 5 3600X'}, {id: 'r5-3600', nombre: 'Ryzen 5 3600'}] },
                        { id: 'ryzen5-2000', nombre: 'Serie 2000', modelos: [{id: 'r5-2600x', nombre: 'Ryzen 5 2600X'}, {id: 'r5-2600', nombre: 'Ryzen 5 2600'}] },
                        { id: 'ryzen5-1000', nombre: 'Serie 1000', modelos: [{id: 'r5-1600x', nombre: 'Ryzen 5 1600X'}, {id: 'r5-1600', nombre: 'Ryzen 5 1600'}] }
                    ]
                    },
                    {
                    id: 'ryzen-3-desktop', nombre: 'Ryzen 3', descripcion: 'Entrada Decente',
                    generaciones: [
                        { id: 'ryzen3-5000', nombre: 'Serie 5000', modelos: [{id: 'r3-5300g', nombre: 'Ryzen 3 5300G'}] },
                        { id: 'ryzen3-4000', nombre: 'Serie 4000', modelos: [{id: 'r3-4300g', nombre: 'Ryzen 3 4300G'}] },
                        { id: 'ryzen3-3000', nombre: 'Serie 3000', modelos: [{id: 'r3-3300x', nombre: 'Ryzen 3 3300X'}, {id: 'r3-3100', nombre: 'Ryzen 3 3100'}, {id: 'r3-3200g', nombre: 'Ryzen 3 3200G'}] },
                        { id: 'ryzen3-2000', nombre: 'Serie 2000', modelos: [{id: 'r3-2200g', nombre: 'Ryzen 3 2200G'}] },
                        { id: 'ryzen3-1000', nombre: 'Serie 1000', modelos: [{id: 'r3-1300x', nombre: 'Ryzen 3 1300X'}, {id: 'r3-1200', nombre: 'Ryzen 3 1200'}] }
                    ]
                    },
                    {
                    id: 'threadripper-desktop', nombre: 'Threadripper', descripcion: 'Workstation Extrema',
                    generaciones: [
                        { id: 'tr-7000', nombre: 'Serie 7000', modelos: [{id: 'tr-7980x', nombre: 'Threadripper 7980X'}, {id: 'tr-7970x', nombre: 'Threadripper 7970X'}] },
                        { id: 'tr-5000', nombre: 'Serie 5000', modelos: [{id: 'tr-5995wx', nombre: 'Threadripper PRO 5995WX'}] },
                        { id: 'tr-3000', nombre: 'Serie 3000', modelos: [{id: 'tr-3990x', nombre: 'Threadripper 3990X'}, {id: 'tr-3970x', nombre: 'Threadripper 3970X'}] }
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
                id: 'intel-aio', nombre: 'Intel',
                familias: [
                    {
                    id: 'core-i7-aio', nombre: 'Core i7', descripcion: 'Gama Alta AIO',
                    generaciones: [
                        { id: '13g-i7', nombre: '13ª Gen', modelos: [{id: 'i7-13700', nombre: 'i7-13700'}, {id: 'i7-13700t', nombre: 'i7-13700T'}, {id: 'i7-1360p', nombre: 'i7-1360P'}, {id: 'i7-1355u', nombre: 'i7-1355U'}] },
                        { id: '12g-i7', nombre: '12ª Gen', modelos: [{id: 'i7-12700', nombre: 'i7-12700'}, {id: 'i7-12700t', nombre: 'i7-12700T'}, {id: 'i7-1260p', nombre: 'i7-1260P'}, {id: 'i7-1255u', nombre: 'i7-1255U'}] },
                        { id: '11g-i7', nombre: '11ª Gen', modelos: [{id: 'i7-11700', nombre: 'i7-11700'}, {id: 'i7-11700t', nombre: 'i7-11700T'}, {id: 'i7-1165g7', nombre: 'i7-1165G7'}] },
                        { id: '10g-i7', nombre: '10ª Gen', modelos: [{id: 'i7-10700', nombre: 'i7-10700'}, {id: 'i7-10700t', nombre: 'i7-10700T'}, {id: 'i7-1065g7', nombre: 'i7-1065G7'}] }
                    ]
                    },
                    {
                    id: 'core-i5-aio', nombre: 'Core i5', descripcion: 'Estándar AIO',
                    generaciones: [
                        { id: '13g-i5', nombre: '13ª Gen', modelos: [{id: 'i5-13500', nombre: 'i5-13500'}, {id: 'i5-13400t', nombre: 'i5-13400T'}, {id: 'i5-1340p', nombre: 'i5-1340P'}, {id: 'i5-1335u', nombre: 'i5-1335U'}] },
                        { id: '12g-i5', nombre: '12ª Gen', modelos: [{id: 'i5-12500', nombre: 'i5-12500'}, {id: 'i5-12400t', nombre: 'i5-12400T'}, {id: 'i5-1240p', nombre: 'i5-1240P'}, {id: 'i5-1235u', nombre: 'i5-1235U'}] },
                        { id: '11g-i5', nombre: '11ª Gen', modelos: [{id: 'i5-11500', nombre: 'i5-11500'}, {id: 'i5-11400t', nombre: 'i5-11400T'}, {id: 'i5-1135g7', nombre: 'i5-1135G7'}] },
                        { id: '10g-i5', nombre: '10ª Gen', modelos: [{id: 'i5-10500', nombre: 'i5-10500'}, {id: 'i5-10400t', nombre: 'i5-10400T'}, {id: 'i5-10210u', nombre: 'i5-10210U'}] }
                    ]
                    },
                    {
                    id: 'core-i3-aio', nombre: 'Core i3', descripcion: 'Básicos',
                    generaciones: [
                        { id: '13g-i3', nombre: '13ª Gen', modelos: [{id: 'i3-13100', nombre: 'i3-13100'}, {id: 'i3-13100t', nombre: 'i3-13100T'}, {id: 'i3-1315u', nombre: 'i3-1315U'}] },
                        { id: '12g-i3', nombre: '12ª Gen', modelos: [{id: 'i3-12100', nombre: 'i3-12100'}, {id: 'i3-12100t', nombre: 'i3-12100T'}, {id: 'i3-1215u', nombre: 'i3-1215U'}] }
                    ]
                    }
                ]
            },
            {
                id: 'amd-aio', nombre: 'AMD',
                familias: [
                    {
                    id: 'ryzen-7-aio', nombre: 'Ryzen 7', descripcion: 'Gama Alta AIO',
                    generaciones: [
                        { id: 'r7-7000-aio', nombre: 'Serie 7000', modelos: [{id: 'r7-7735u-aio', nombre: 'Ryzen 7 7735U'}, {id: 'r7-7730u-aio', nombre: 'Ryzen 7 7730U'}] },
                        { id: 'r7-6000-aio', nombre: 'Serie 6000', modelos: [{id: 'r7-6800h-aio', nombre: 'Ryzen 7 6800H'}, {id: 'r7-6800u-aio', nombre: 'Ryzen 7 6800U'}] },
                        { id: 'r7-5000-aio', nombre: 'Serie 5000', modelos: [{id: 'r7-5825u-aio', nombre: 'Ryzen 7 5825U'}, {id: 'r7-5800u-aio', nombre: 'Ryzen 7 5800U'}, {id: 'r7-5700g-aio', nombre: 'Ryzen 7 5700G'}, {id: 'r7-5700u-aio', nombre: 'Ryzen 7 5700U'}] },
                        { id: 'r7-4000-aio', nombre: 'Serie 4000', modelos: [{id: 'r7-4800h-aio', nombre: 'Ryzen 7 4800H'}, {id: 'r7-4700g-aio', nombre: 'Ryzen 7 4700G'}, {id: 'r7-4700u-aio', nombre: 'Ryzen 7 4700U'}] }
                    ]
                    },
                    {
                    id: 'ryzen-5-aio', nombre: 'Ryzen 5', descripcion: 'Gama Media AIO',
                    generaciones: [
                        { id: 'r5-7000-aio', nombre: 'Serie 7000', modelos: [{id: 'r5-7530u-aio', nombre: 'Ryzen 5 7530U'}, {id: 'r5-7520u-aio', nombre: 'Ryzen 5 7520U'}] },
                        { id: 'r5-6000-aio', nombre: 'Serie 6000', modelos: [{id: 'r5-6600h-aio', nombre: 'Ryzen 5 6600H'}, {id: 'r5-6600u-aio', nombre: 'Ryzen 5 6600U'}] },
                        { id: 'r5-5000-aio', nombre: 'Serie 5000', modelos: [{id: 'r5-5625u-aio', nombre: 'Ryzen 5 5625U'}, {id: 'r5-5600g-aio', nombre: 'Ryzen 5 5600G'}, {id: 'r5-5600u-aio', nombre: 'Ryzen 5 5600U'}, {id: 'r5-5500u-aio', nombre: 'Ryzen 5 5500U'}] },
                        { id: 'r5-4000-aio', nombre: 'Serie 4000', modelos: [{id: 'r5-4600g-aio', nombre: 'Ryzen 5 4600G'}, {id: 'r5-4600h-aio', nombre: 'Ryzen 5 4600H'}, {id: 'r5-4500u-aio', nombre: 'Ryzen 5 4500U'}] }
                    ]
                    },
                    {
                    id: 'ryzen-3-aio', nombre: 'Ryzen 3', descripcion: 'Entrada AIO',
                    generaciones: [
                        { id: 'r3-7000-aio', nombre: 'Serie 7000', modelos: [{id: 'r3-7320u-aio', nombre: 'Ryzen 3 7320U'}] },
                        { id: 'r3-5000-aio', nombre: 'Serie 5000', modelos: [{id: 'r3-5425u-aio', nombre: 'Ryzen 3 5425U'}, {id: 'r3-5300g-aio', nombre: 'Ryzen 3 5300G'}, {id: 'r3-5300u-aio', nombre: 'Ryzen 3 5300U'}] },
                        { id: 'r3-4000-aio', nombre: 'Serie 4000', modelos: [{id: 'r3-4300g-aio', nombre: 'Ryzen 3 4300G'}, {id: 'r3-4300u-aio', nombre: 'Ryzen 3 4300U'}] }
                    ]
                    },
                    {
                    id: 'athlon-aio', nombre: 'Athlon', descripcion: 'Básicos',
                    generaciones: [
                        { id: 'athlon-gold-aio', nombre: 'Athlon Gold / Silver', modelos: [{id: 'athlon-gold-3150u-aio', nombre: 'Athlon Gold 3150U'}, {id: 'athlon-silver-3050u-aio', nombre: 'Athlon Silver 3050U'}] }
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