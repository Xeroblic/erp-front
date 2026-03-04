// Type declarations for html5-qrcode
// This ensures TypeScript compiles even if the package isn't installed yet.

declare module 'html5-qrcode' {
	export interface Html5QrcodeScannerConfig {
		fps?: number;
		qrbox?: number | { width: number; height: number };
		aspectRatio?: number;
		disableFlip?: boolean;
		videoConstraints?: MediaTrackConstraints;
	}

	export interface Html5QrcodeCameraScanConfig {
		facingMode?: string | { exact: string };
		deviceId?: { exact: string };
	}

	export class Html5Qrcode {
		constructor(elementId: string, verbose?: boolean);
		start(
			cameraIdOrConfig: string | Html5QrcodeCameraScanConfig,
			configuration: Html5QrcodeScannerConfig,
			qrCodeSuccessCallback: (decodedText: string, result?: unknown) => void,
			qrCodeErrorCallback?: (errorMessage: string, error?: unknown) => void,
		): Promise<void>;
		stop(): Promise<void>;
		clear(): void;
		static getCameras(): Promise<Array<{ id: string; label: string }>>;
	}

	export class Html5QrcodeScanner {
		constructor(
			elementId: string,
			config: Html5QrcodeScannerConfig,
			verbose?: boolean,
		);
		render(
			qrCodeSuccessCallback: (decodedText: string, result?: unknown) => void,
			qrCodeErrorCallback?: (errorMessage: string, error?: unknown) => void,
		): void;
		clear(): Promise<void>;
	}
}
