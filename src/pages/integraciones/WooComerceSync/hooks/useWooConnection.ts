import { useState } from 'react';
import { WooConfig } from '../types/wooSync.types';

export const useWooConnection = () => {
    const [wooConfig, setWooConfig] = useState<WooConfig>({
        site_url: 'https://mitienda.com',
        consumer_key: 'ck_*********************',
        consumer_secret: 'cs_*********************',
        status: 'connected',
    });
    return { wooConfig, setWooConfig };
};