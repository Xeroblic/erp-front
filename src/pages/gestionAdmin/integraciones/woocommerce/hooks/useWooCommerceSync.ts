
import { useState } from 'react';

export interface SyncResult {
    estado: 'inicial' | 'desfasado' | 'desactivado' | 'exitoso' | 'error';
    productosProcesados: number;
    advertencias: string[];
    log: string;
}

export const useWooCommerceSync = () => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<SyncResult | null>(null);

    const syncProductosStock = async () => {
        setLoading(true);
        // Simulación de llamada a la API y lógica de impacto
        await new Promise((r) => setTimeout(r, 1500));
        // Mock: alterna entre estados
        const estados = ['inicial', 'desfasado', 'exitoso', 'error'];
        const estado = estados[Math.floor(Math.random() * estados.length)] as SyncResult['estado'];
        setResult({
            estado,
            productosProcesados: Math.floor(Math.random() * 50) + 1,
            advertencias: estado === 'desfasado' ? ['Algunos productos tienen diferencias de stock'] : [],
            log:
                estado === 'error'
                    ? 'Error de conexión con WooCommerce. Verifica credenciales y conectividad.'
                    : 'Sincronización finalizada correctamente.',
        });
        setLoading(false);
    };

    return {
        loading,
        result,
        syncProductosStock,
    };
};
