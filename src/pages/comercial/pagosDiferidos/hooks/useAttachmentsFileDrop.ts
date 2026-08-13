import { useCallback, useEffect, useRef, useState } from 'react';

interface UseAttachmentsFileDropOptions {
	/** El modal esta abierto. Sin esto no se registra ningun listener global. */
	isActive: boolean;
	/** El usuario puede soltar archivos (permiso, estado del formulario, modales hijos). */
	canDrop: boolean;
	onFiles: (files: FileList | null) => void;
}

interface UseAttachmentsFileDropResult {
	/** Hay un arrastre de archivos en curso y se puede soltar. */
	isDraggingFile: boolean;
}

const hasFiles = (event: DragEvent): boolean =>
	Array.from(event.dataTransfer?.types ?? []).includes('Files');

/**
 * Permite adjuntar archivos soltandolos en cualquier parte del modal.
 *
 * Mientras el modal esta abierto se cancela el comportamiento del navegador para
 * cualquier archivo soltado en la ventana: sin eso, el navegador abre el archivo
 * y se pierde el formulario en curso. La entrega de los archivos al modulo solo
 * ocurre cuando `canDrop` es verdadero.
 */
const useAttachmentsFileDrop = ({
	isActive,
	canDrop,
	onFiles,
}: UseAttachmentsFileDropOptions): UseAttachmentsFileDropResult => {
	const [isDraggingFile, setIsDraggingFile] = useState(false);
	const dragDepthRef = useRef(0);
	const canDropRef = useRef(canDrop);
	const onFilesRef = useRef(onFiles);

	useEffect(() => {
		canDropRef.current = canDrop;
		if (!canDrop) setIsDraggingFile(false);
	}, [canDrop]);

	useEffect(() => {
		onFilesRef.current = onFiles;
	}, [onFiles]);

	const resetDrag = useCallback(() => {
		dragDepthRef.current = 0;
		setIsDraggingFile(false);
	}, []);

	useEffect(() => {
		if (!isActive || typeof window === 'undefined') return undefined;

		const onDragEnter = (event: DragEvent) => {
			if (!hasFiles(event)) return;
			event.preventDefault();
			dragDepthRef.current += 1;
			if (canDropRef.current) setIsDraggingFile(true);
		};

		const onDragOver = (event: DragEvent) => {
			if (!hasFiles(event)) return;
			// Sin preventDefault el navegador abre el archivo y descarta el formulario.
			event.preventDefault();
			if (event.dataTransfer)
				event.dataTransfer.dropEffect = canDropRef.current ? 'copy' : 'none';
			if (canDropRef.current) setIsDraggingFile(true);
		};

		const onDragLeave = (event: DragEvent) => {
			if (!hasFiles(event)) return;
			event.preventDefault();
			dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
			if (dragDepthRef.current === 0) setIsDraggingFile(false);
		};

		const onDrop = (event: DragEvent) => {
			if (!hasFiles(event)) return;
			event.preventDefault();
			dragDepthRef.current = 0;
			setIsDraggingFile(false);
			if (!canDropRef.current) return;
			const droppedFiles = event.dataTransfer?.files ?? null;
			if (droppedFiles && droppedFiles.length > 0) onFilesRef.current(droppedFiles);
		};

		window.addEventListener('dragenter', onDragEnter);
		window.addEventListener('dragover', onDragOver);
		window.addEventListener('dragleave', onDragLeave);
		window.addEventListener('drop', onDrop);

		return () => {
			window.removeEventListener('dragenter', onDragEnter);
			window.removeEventListener('dragover', onDragOver);
			window.removeEventListener('dragleave', onDragLeave);
			window.removeEventListener('drop', onDrop);
			resetDrag();
		};
	}, [isActive, resetDrag]);

	return { isDraggingFile };
};

export default useAttachmentsFileDrop;
