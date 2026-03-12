import { useState, useEffect, useCallback } from 'react';

// Función auxiliar para comparar versiones (ej: "1.0.0" vs "v1.0.1")
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
			// 1. Obtener la versión manual (local)
			let localCliVersion = '0.0.0';
			try {
				const localResponse = await fetch('/instaladores/version.json');
				if (localResponse.ok) {
					const localData = await localResponse.json();
					localCliVersion = localData.cli || '0.0.0';
				}
			} catch (e) {
				console.warn('No se encontró version.json local o hubo un error al leerlo');
			}

			// 2. Obtener la última versión de GitHub
			let githubCliVersion = '0.0.0';
			let githubDownloadUrl = '';

			try {
				const response = await fetch('https://api.github.com/repos/R4aveen/zentria-cli/releases/latest');
				if (response.ok) {
					const data = await response.json();
					githubCliVersion = data.tag_name;
					
					const zipAsset = data.assets?.find((asset: any) => asset.name.endsWith('.zip'));
					if (zipAsset) {
						githubDownloadUrl = zipAsset.browser_download_url;
					} else {
						const safeVersion = data.tag_name.startsWith('v') ? data.tag_name : `v${data.tag_name}`;
						githubDownloadUrl = `https://github.com/R4aveen/zentria-cli/raw/refs/tags/${data.tag_name}/build/Zentria-CLI-${safeVersion}.zip`;
					}
				} else {
					const tagsResponse = await fetch('https://api.github.com/repos/R4aveen/zentria-cli/tags');
					if (tagsResponse.ok) {
						const tagsData = await tagsResponse.json();
						if (tagsData.length > 0) {
							githubCliVersion = tagsData[0].name;
							const safeVersion = githubCliVersion.startsWith('v') ? githubCliVersion : `v${githubCliVersion}`;
							githubDownloadUrl = `https://github.com/R4aveen/zentria-cli/raw/refs/tags/${githubCliVersion}/build/Zentria-CLI-${safeVersion}.zip`;
						}
					}
				}
			} catch (e) {
				console.warn('Error fetching CLI from GitHub, will use local if available');
			}

			// 3. Comparar local vs github
			if (localCliVersion !== '0.0.0' && compareVersions(localCliVersion, githubCliVersion) >= 0) {
				// La versión manual es más reciente o igual a la de github
				const formattedVersion = localCliVersion.startsWith('v') ? localCliVersion : `v${localCliVersion}`;
				setLatestVersion(formattedVersion);
				setDownloadUrl(`/instaladores/Zentria-CLI-${formattedVersion}.zip`);
			} else if (githubCliVersion !== '0.0.0') {
				// GitHub es más reciente
				setLatestVersion(githubCliVersion);
				setDownloadUrl(githubDownloadUrl);
			} else {
				// No hay versiones en ningún lado (poco probable)
				setLatestVersion(null);
				setDownloadUrl(null);
			}

		} catch (error) {
			console.error('Error fetching CLI latest version:', error);
		}
	};

	useEffect(() => {
		fetchVersions();
	}, []);

	const handleDownloadCli = useCallback(() => {
		if (latestVersion && downloadUrl) {
			localStorage.setItem('zentria_cli_version', latestVersion);
			setSavedVersion(latestVersion);
			window.open(downloadUrl, '_blank');
		}
	}, [latestVersion, downloadUrl]);

	const hasNewVersion = latestVersion !== null && latestVersion !== savedVersion;

	return {
		latestVersion,
		savedVersion,
		hasNewVersion,
		handleDownloadCli,
		isReady: latestVersion !== null
	};
};
