import { TDocumentDefinitions } from "pdfmake/interfaces";

// Garantiza que TS sepa que el retorno SIEMPRE es Content[]
export const safeStack = (items: any[]): any[] =>
    items.filter((x) => x !== undefined && x !== null);

export const safeColumns = (cols: any[]): any[] =>
    cols.filter((x) => x !== undefined && x !== null);

export const safeContent = (blocks: any[]): any[] =>
    blocks.filter((x) => x !== undefined && x !== null);


export const buildPdfDefinition = (tpl: any): TDocumentDefinitions => ({
    pageSize: "A4",
    pageMargins: [30, 30, 30, 40],
    defaultStyle: {
        font: "Roboto",
        fontSize: 9,
        color: "#111827"
    },

    
    content: safeContent([
        // ========== ENCABEZADO ==========
        {
            columns: safeColumns([
                {
                    width: "*",
                    stack: safeStack([
                        { text: tpl.header.tagline, fontSize: 9, color: "#6b7280" },
                        { text: tpl.header.companyName, fontSize: 16, bold: true, margin: [0, 2, 0, 2] },
                        tpl.header.description
                            ? { text: tpl.header.description, fontSize: 9, margin: [0, 2] }
                            : undefined,
                        ...tpl.header.addresses.map((a: string) => ({
                            text: a,
                            fontSize: 9
                        })),
                        tpl.header.website
                            ? { text: tpl.header.website, fontSize: 9, margin: [0, 2] }
                            : undefined,
                    ]),
                },
                {
                    width: 170,
                    stack: safeStack([
                        {
                            canvas: [
                                { type: "rect", x: 0, y: 0, w: 170, h: 85, r: 6, lineWidth: 1.6, lineColor: "#c2410c" }
                            ]
                        },
                        { text: "R.U.T.", alignment: "center", color: "#6b7280", margin: [0, 6, 0, 0] },
                        { text: tpl.header.rut, fontSize: 18, bold: true, alignment: "center", margin: [0, 3] },
                        {
                            canvas: [
                                { type: "line", x1: 10, y1: 0, x2: 160, y2: 0, lineWidth: 1, lineColor: "#fde68a" }
                            ]
                        },
                        { text: tpl.header.documentLabel, alignment: "center", margin: [0, 5] },
                        {
                            text: `N° ${tpl.header.documentNumber}`,
                            alignment: "center",
                            fontSize: 14,
                            bold: true
                        },
                        tpl.header.branchSII
                            ? { text: tpl.header.branchSII, alignment: "center", margin: [0, 6] }
                            : undefined
                    ]),
                }
            ])
        },

        { text: "POR LO SIGUIENTE", alignment: "center", bold: true, margin: [0, 14] },

        // ========== CLIENTE ==========
        {
            table: {
                widths: ["30%", "70%"],
                body: Object.entries(tpl.clientInfo).flatMap(([key, val]) => {
                    if (key === "seller") return [];
                    if (["emissionDate","emissionTime","paymentCondition","deliveryCondition"].includes(key)) return [];
                    return [
                        [
                            { text: key.replace(/([A-Z])/g, " $1"), bold: true, fillColor: "#f3f4f6" },
                            { text: String(val ?? "—") }
                        ]
                    ];
                })
            },
            margin: [0, 8]
        },

        // ========== OBSERVACIONES ==========
        tpl.observations.lines.length
            ? {
                margin: [0, 16],
                stack: safeStack([
                    { text: "Observaciones", bold: true, margin: [0, 0, 0, 4] },
                    ...tpl.observations.lines.map((l: string) => ({
                        text: l,
                        margin: [0, 2]
                    }))
                ])
            }
            : undefined
    ]),

});

// Helper
const formatCLP = (value: number) =>
    new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0 }).format(value);
