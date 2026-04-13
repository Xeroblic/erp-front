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
  const [savedVersion, setSavedVersion] = useState<string | null>(() => localStorage.getItem('zentria_cli_version'));

  const fetchVersions = async () => {
    try {
      let localCliVersion = '0.0.0';
      try {
        const localResponse = await fetch('/instaladores/version.json', { cache: 'no-store' });
        if (localResponse.ok) {
          const localData = await localResponse.json();
          localCliVersion = localData.cli || '0.0.0';
        }
      } catch (error) {
        console.warn('[useCliVersion] Failed to fetch local version:', error);
      }

      let githubCliVersion = '0.0.0';
      let githubDownloadUrl = '';

      try {
        const response = await fetch('https://api.github.com/repos/R4aveen/zentria-cli/releases/latest', {
          cache: 'no-store'
        });

        if (response.ok) {
          const data = await response.json();
          githubCliVersion = data.tag_name; // ej: v1.2.0
          const tagLower = String(data.tag_name || '').toLowerCase();
          const expectedName = `zentria-cli-${tagLower}.zip`;

          const assets = Array.isArray(data.assets) ? data.assets : [];
          const exactAsset = assets.find((a: any) => String(a.name || '').toLowerCase() === expectedName);

          // fallback defensivo si no existe el exacto: elegir el más nuevo por updated_at
          const fallbackAsset = assets
            .filter((a: any) => String(a.name || '').toLowerCase().startsWith('zentria-cli-v') && String(a.name || '').toLowerCase().endsWith('.zip'))
            .sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0];

          const selected = exactAsset || fallbackAsset;

          if (selected?.browser_download_url) {
            githubDownloadUrl = selected.browser_download_url;
          } else {
            githubCliVersion = '0.0.0';
          }
        }
      } catch (error) {
        console.warn('[useCliVersion] Failed to fetch GitHub version:', error);
      }

      // cambio importante:
      // local SOLO gana si es MAYOR que github (no mayor o igual)
      if (localCliVersion !== '0.0.0' && githubCliVersion !== '0.0.0' && compareVersions(localCliVersion, githubCliVersion) > 0) {
        const formattedVersion = localCliVersion.startsWith('v') ? localCliVersion : `v${localCliVersion}`;
        setLatestVersion(formattedVersion);
        setDownloadUrl(`/instaladores/Zentria-CLI-${formattedVersion}.zip`);
      } else if (githubCliVersion !== '0.0.0' && githubDownloadUrl) {
        setLatestVersion(githubCliVersion);
        setDownloadUrl(githubDownloadUrl);
      } else if (localCliVersion !== '0.0.0') {
        const formattedVersion = localCliVersion.startsWith('v') ? localCliVersion : `v${localCliVersion}`;
        setLatestVersion(formattedVersion);
        setDownloadUrl(`/instaladores/Zentria-CLI-${formattedVersion}.zip`);
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