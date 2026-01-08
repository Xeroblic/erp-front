/**
 * EJEMPLO DE PERSONALIZACIÓN DE ETIQUETAS
 * 
 * Este archivo muestra ejemplos de cómo personalizar el componente PrintLabel
 * según diferentes necesidades del negocio.
 */

// ============================================
// 1. CAMBIAR EL CONTENIDO DEL QR
// ============================================

// Opción A: URL al detalle completo (actual)
const qrContent = `${window.location.origin}/technical-reviews/items/${item.id}`;

// Opción B: Solo el número de serie
const qrContent = item.serial_number;

// Opción C: JSON con múltiple información
const qrContent = JSON.stringify({
    id: item.id,
    serial: item.serial_number,
    grade: item.grade,
    type: item.equipment_type
});

// Opción D: URL externa a sistema de inventario
const qrContent = `https://inventario.ecopc.cl/serie/${item.serial_number}`;


// ============================================
// 2. PERSONALIZAR ESPECIFICACIONES MOSTRADAS
// ============================================

// Ejemplo: Priorizar información específica según tipo de equipo
const buildCustomSpecs = (item: IItem): string => {
    const attrs = item.attributes_json || {};
    const type = typeof item.equipment_type === 'object'
        ? (item.equipment_type as any)?.value
        : item.equipment_type;

    // Para notebooks, enfatizar batería y pantalla
    if (type === 'notebook') {
        return [
            attrs.brand && `${attrs.brand}`,
            attrs.model && `${attrs.model}`,
            attrs.processor && `CPU: ${attrs.processor}`,
            attrs.ram_size && `RAM: ${attrs.ram_size}`,
            attrs.battery_status && `Batería: ${attrs.battery_status}`,
            attrs.screen_inches && `${attrs.screen_inches}" ${attrs.screen_resolution || ''}`
        ].filter(Boolean).join(' • ');
    }

    // Para monitores, enfatizar resolución y puertos
    if (type === 'monitor') {
        return [
            attrs.brand && `${attrs.brand}`,
            attrs.model && `${attrs.model}`,
            attrs.screen_inches && `${attrs.screen_inches}"`,
            attrs.screen_resolution && `${attrs.screen_resolution}`,
            attrs.hdmi_ports && `HDMI: ${attrs.hdmi_ports}`,
            attrs.displayport_ports && `DP: ${attrs.displayport_ports}`
        ].filter(Boolean).join(' • ');
    }

    // Default: mostrar lo más relevante
    return Object.entries(attrs)
        .slice(0, 5)
        .map(([key, val]) => `${key}: ${val}`)
        .join(' • ');
};


// ============================================
// 3. DIFERENTES TAMAÑOS DE ETIQUETA
// ============================================

// Etiqueta pequeña (4x6 cm)
const smallLabelStyles = `
	@page {
		size: 40mm 60mm;
		margin: 0;
	}
	.label-container {
		width: 40mm;
		height: 60mm;
		padding: 3mm;
		font-size: 8px;
	}
`;

// Etiqueta mediana (6x8 cm) - ACTUAL
const mediumLabelStyles = `
	@page {
		size: 60mm 80mm;
		margin: 0;
	}
	.label-container {
		width: 60mm;
		height: 80mm;
		padding: 5mm;
		font-size: 10px;
	}
`;

// Etiqueta grande (10x15 cm)
const largeLabelStyles = `
	@page {
		size: 100mm 150mm;
		margin: 0;
	}
	.label-container {
		width: 100mm;
		height: 150mm;
		padding: 8mm;
		font-size: 14px;
	}
`;


// ============================================
// 4. AGREGAR CÓDIGO DE BARRAS ADEMÁS DE QR
// ============================================

// Instalar: npm install react-barcode
import Barcode from 'react-barcode';

// En el componente:
<div className="barcode-section" >
    <Barcode 
		value={ item.serial_number }
width = { 1.5}
height = { 30}
fontSize = { 10}
    />
    </div>


// ============================================
// 5. AGREGAR PRECIO A LA ETIQUETA
// ============================================

const PriceLabel: React.FC<PrintLabelProps> = ({ item }) => {
    // Obtener precio desde item.details o hacer fetch
    const price = item.details?.suggested_price || 'Consultar';

    return (
        <div className= "price-section" style = {{
        backgroundColor: '#FFD700',
            padding: '2mm',
                textAlign: 'center',
                    fontWeight: 'bold',
                        fontSize: '14px'
    }
}>
    ${ price.toLocaleString('es-CL') }
</div>
	);
};


// ============================================
// 6. IMPRIMIR MÚLTIPLES ETIQUETAS A LA VEZ
// ============================================

// Modificar ItemList.tsx para permitir selección múltiple:
const [selectedItems, setSelectedItems] = useState<IItem[]>([]);

// Botón para imprimir seleccionadas:
<Button onClick={
    () => {
        selectedItems.forEach(item => {
            // Abrir una ventana por cada etiqueta
            const printWindow = window.open('', '_blank');
            printWindow.document.write(renderLabelHTML(item));
            printWindow.print();
        });
    }
}>
    Imprimir { selectedItems.length } etiquetas
        </Button>


// ============================================
// 7. GUARDAR ETIQUETA COMO PDF
// ============================================

// Instalar: npm install html2pdf.js
import html2pdf from 'html2pdf.js';

const saveLabelAsPDF = () => {
    const element = printRef.current;
    const opt = {
        margin: 0,
        filename: `etiqueta-${item.serial_number}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: [60, 80], orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
};


// ============================================
// 8. TEMPLATE CON COLORES SEGÚN GRADO
// ============================================

const getGradeColor = (grade: string | null | undefined): string => {
    switch (grade?.toUpperCase()) {
        case 'A': return '#10B981'; // Verde
        case 'B': return '#3B82F6'; // Azul
        case 'C': return '#F59E0B'; // Naranja
        case 'D': return '#EF4444'; // Rojo
        default: return '#6B7280'; // Gris
    }
};

// En el render:
<div style={
    {
        backgroundColor: getGradeColor(item.grade),
            color: 'white',
                padding: '2mm',
                    textAlign: 'center',
                        fontWeight: 'bold'
    }
}>
    GRADO { item.grade || 'C' }
</div>


// ============================================
// 9. AGREGAR FECHA DE REVISIÓN
// ============================================

const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

// En la etiqueta:
<div style={ { fontSize: '8px', color: '#666' } }>
    Revisado: { formatDate(item.updated_at) }
</div>


// ============================================
// 10. IMPRIMIR AUTOMÁTICAMENTE AL APROBAR
// ============================================

// En el flujo de aprobación, agregar:
const handleApprove = async (itemId: number) => {
    await dispatch(approveItem({ branchId, itemId })).unwrap();

    // Auto-imprimir etiqueta
    const item = items.find(i => i.id === itemId);
    if (item) {
        setItemToPrint(item);
        setIsPrintLabelOpen(true);
        // Esperar 500ms y auto-imprimir
        setTimeout(() => {
            window.print();
        }, 500);
    }
};

export { };
