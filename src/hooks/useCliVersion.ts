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

const CLI_VERSION_CACHE_KEY = 'zentria_cli_latest_cache';
const CLI_VERSION_CACHE_TTL_MS = 10 * 60 * 1000;

type CliVersionPayload = {
  latestVersion: string | null;
  downloadUrl: string | null;
  fetchedAt: number;
};

let inMemoryCache: CliVersionPayload | null = null;
let inFlightPromise: Promise<CliVersionPayload> | null = null;

const readSessionCache = (): CliVersionPayload | null => {
  try {
    const raw = sessionStorage.getItem(CLI_VERSION_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CliVersionPayload;
    if (!parsed?.fetchedAt) return null;
    if (Date.now() - parsed.fetchedAt > CLI_VERSION_CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
};

const writeSessionCache = (payload: CliVersionPayload) => {
  try {
    sessionStorage.setItem(CLI_VERSION_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // ignore cache write failures
  }
};

const buildPayload = (latestVersion: string | null, downloadUrl: string | null): CliVersionPayload => ({
  latestVersion,
  downloadUrl,
  fetchedAt: Date.now(),
});

const resolveVersions = async (): Promise<CliVersionPayload> => {
  const fromMemory = inMemoryCache && Date.now() - inMemoryCache.fetchedAt <= CLI_VERSION_CACHE_TTL_MS
    ? inMemoryCache
    : null;
  if (fromMemory) return fromMemory;

  const fromSession = readSessionCache();
  if (fromSession) {
    inMemoryCache = fromSession;
    return fromSession;
  }

  if (inFlightPromise) return inFlightPromise;

  const shouldFetchGithub = !import.meta.env.DEV || import.meta.env.VITE_CLI_VERSION_CHECK_GITHUB === 'true';

  inFlightPromise = (async () => {
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

      if (shouldFetchGithub) {
        try {
          const response = await fetch('https://api.github.com/repos/R4aveen/zentria-cli/releases/latest', {
            cache: 'no-store'
          });

          if (response.ok) {
            const data = await response.json();
            githubCliVersion = data.tag_name;
            const tagLower = String(data.tag_name || '').toLowerCase();
            const expectedName = `zentria-cli-${tagLower}.zip`;

            const assets = Array.isArray(data.assets) ? data.assets : [];
            const exactAsset = assets.find((a: any) => String(a.name || '').toLowerCase() === expectedName);

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
      }

      let latestVersion: string | null = null;
      let downloadUrl: string | null = null;

      if (localCliVersion !== '0.0.0' && githubCliVersion !== '0.0.0' && compareVersions(localCliVersion, githubCliVersion) > 0) {
        const formattedVersion = localCliVersion.startsWith('v') ? localCliVersion : `v${localCliVersion}`;
        latestVersion = formattedVersion;
        downloadUrl = `/instaladores/Zentria-CLI-${formattedVersion}.zip`;
      } else if (githubCliVersion !== '0.0.0' && githubDownloadUrl) {
        latestVersion = githubCliVersion;
        downloadUrl = githubDownloadUrl;
      } else if (localCliVersion !== '0.0.0') {
        const formattedVersion = localCliVersion.startsWith('v') ? localCliVersion : `v${localCliVersion}`;
        latestVersion = formattedVersion;
        downloadUrl = `/instaladores/Zentria-CLI-${formattedVersion}.zip`;
      }

      const payload = buildPayload(latestVersion, downloadUrl);
      inMemoryCache = payload;
      writeSessionCache(payload);
      return payload;
    } catch (error) {
      console.error('Error in fetchVersions:', error);
      return buildPayload(null, null);
    } finally {
      inFlightPromise = null;
    }
  })();

  return inFlightPromise;
};

export const useCliVersion = () => {
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [savedVersion, setSavedVersion] = useState<string | null>(() => localStorage.getItem('zentria_cli_version'));

  useEffect(() => {
    let mounted = true;
    void resolveVersions().then((payload) => {
      if (!mounted) return;
      setLatestVersion(payload.latestVersion);
      setDownloadUrl(payload.downloadUrl);
    });

    return () => {
      mounted = false;
    };
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