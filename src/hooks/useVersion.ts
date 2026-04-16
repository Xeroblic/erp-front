import { useEffect, useMemo, useState } from 'react';
import ApiService from '@/services/ApiService';

const VERSION_CACHE_TTL_MS = 5 * 60 * 1000;
let cachedVersion: { value: string; fetchedAt: number } | null = null;
let versionPromise: Promise<string> | null = null;

const resolveVersion = async (versionEndpoint: string): Promise<string> => {
    if (!versionEndpoint) return '';

    if (cachedVersion && Date.now() - cachedVersion.fetchedAt < VERSION_CACHE_TTL_MS) {
        return cachedVersion.value;
    }

    if (versionPromise) return versionPromise;

    versionPromise = (async () => {
        const data = await ApiService.fetchNormalized<{ version?: string } | string>({
            url: versionEndpoint,
            method: 'get',
            cacheTTLms: 60_000,
            dedupe: true,
        });

        const next =
            (data as any)?.version ?? (data as any)?.data ?? (data as any)?.versionSDE ?? data;

        const resolved = next ? next.toString().trim() : '';
        if (resolved) {
            cachedVersion = { value: resolved, fetchedAt: Date.now() };
        }
        return resolved;
    })();

    try {
        return await versionPromise;
    } finally {
        versionPromise = null;
    }
};

export function useVersion() {
    const [version, setVersion] = useState('');

    const versionEndpoint = useMemo(() => {
        const env = import.meta.env as Record<string, string | undefined>;
        const fromEnv =
            env.VITE_APP_VERSION ||
            env.VITE_VERSION_URL ||
            env.VITE_VERSION_ENDPOINT ||
            env.REACT_APP_VERSION ||
            '';
        if (fromEnv) return fromEnv;
        const apiUrl = env.VITE_API_URL;
        return apiUrl ? `${apiUrl.replace(/\/$/, '')}/version` : '';
    }, []);

    useEffect(() => {
        let mounted = true;
        const fetchVersion = async () => {
            if (!versionEndpoint) return;
            try {
                const next = await resolveVersion(versionEndpoint);
                if (next && mounted) {
                    setVersion(next);
                }
            } catch (error) {
                console.error('No se pudo obtener la versión SDE', error);
            }
        };
        void fetchVersion();
        return () => {
            mounted = false;
        };
    }, [versionEndpoint]);

    return version;
}
