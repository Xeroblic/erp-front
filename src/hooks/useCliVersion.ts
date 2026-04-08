import { useState, useEffect, useCallback } from 'react';

const compareVersions = (v1: string, v2: string) => {
    const parseVersion = (v: string) => v.replace(/^v/, '').split('.').map(Number);
    const parts1 = parseVersion(v1);
    const parts2 = parseVersion(v2);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const num1 = parts1[i] || 0;
        const num2 = parts2[i] || 0;
        if (num1 > num2) return 1;
        if (num1 < num2) return -1;
    }
    return 0;
};

export const useCliVersion = () => {
    const [latestVersion, setLatestVersion] = useState<string | null>(null);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [savedVersion, setSavedVersion] = useState<string | null>(() => {
        return localStorage.getItem('zentria_cli_version');
    });

    const fetchVersions = async () => {
        try {
            let localCliVersion = '0.0.0';
            try {
                const localResponse = await fetch('/instaladores/version.json');
                if (localResponse.ok) {
                    const localData = await localResponse.json();
                    localCliVersion = localData.cli || '0.0.0';
                }
            } catch (e) {
                console.warn('No local version.json found');
            }

            let githubCliVersion = '0.0.0';
            let githubDownloadUrl = '';

            try {
                // Intentar obtener la última release
                const response = await fetch('https://api.github.com/repos/R4aveen/zentria-cli/releases/latest');
                
                if (response.ok) {
                    const data = await response.json();
                    githubCliVersion = data.tag_name;
                    
                    // 1. Intentar buscar un .zip en los Assets de la release (lo ideal)
                    const zipAsset = data.assets?.find((asset: any) => asset.name.toLowerCase().endsWith('.zip'));
                    
                    if (zipAsset) {
                        githubDownloadUrl = zipAsset.browser_download_url;
                    } else {
                        // 2. Fallback: Si no hay assets subidos, descargar el Source Code (ZIP) que GitHub genera
                        // La URL correcta es: https://github.com/USUARIO/REPO/archive/refs/tags/TAG.zip
                        githubDownloadUrl = `https://github.com/R4aveen/zentria-cli/archive/refs/tags/${data.tag_name}.zip`;
                    }
                } else {
                    // 3. Fallback si falla la API de Releases: usar el último Tag
                    const tagsResponse = await fetch('https://api.github.com/repos/R4aveen/zentria-cli/tags');
                    if (tagsResponse.ok) {
                        const tagsData = await tagsResponse.json();
                        if (tagsData.length > 0) {
                            githubCliVersion = tagsData[0].name;
                            githubDownloadUrl = `https://github.com/R4aveen/zentria-cli/archive/refs/tags/${githubCliVersion}.zip`;
                        }
                    }
                }
            } catch (e) {
                console.error('GitHub fetch failed', e);
            }

            // Lógica de comparación y seteo
            if (localCliVersion !== '0.0.0' && compareVersions(localCliVersion, githubCliVersion) >= 0) {
                const formattedVersion = localCliVersion.startsWith('v') ? localCliVersion : `v${localCliVersion}`;
                setLatestVersion(formattedVersion);
                setDownloadUrl(`/instaladores/Zentria-CLI-${formattedVersion}.zip`);
            } else if (githubCliVersion !== '0.0.0') {
                setLatestVersion(githubCliVersion);
                setDownloadUrl(githubDownloadUrl);
            }

        } catch (error) {
            console.error('Error in fetchVersions:', error);
        }
    };

    useEffect(() => {
        fetchVersions();
    }, []);

    const handleDownloadCli = useCallback(() => {
        if (downloadUrl) {
            if (latestVersion) {
                localStorage.setItem('zentria_cli_version', latestVersion);
                setSavedVersion(latestVersion);
            }
            window.open(downloadUrl, '_blank');
        }
    }, [latestVersion, downloadUrl]);

    return {
        latestVersion,
        savedVersion,
        hasNewVersion: latestVersion !== null && latestVersion !== savedVersion,
        handleDownloadCli,
        isReady: latestVersion !== null
    };
};