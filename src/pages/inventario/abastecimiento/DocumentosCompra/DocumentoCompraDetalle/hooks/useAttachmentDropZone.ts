import { useCallback, useRef, useState } from 'react';

/**
 * Arrastrar y soltar archivos sobre la caja de adjuntos del detalle de
 * documento de compra — mismo comportamiento que el arrastre de pagos
 * diferidos (`useAttachmentsFileDrop`), pero acotado al propio elemento en
 * vez de a toda la ventana: acá no hay un modal que posea el viewport, así
 * que escuchar `dragenter`/`dragover` en `window` capturaría arrastres que no
 * tienen nada que ver con esta card.
 *
 * `dragDepthRef` cuenta entradas/salidas anidadas (la caja tiene hijos:
 * texto, botón) para que un `dragleave` hacia un hijo no apague el estado
 * antes de que el arrastre realmente salga de la caja.
 */

interface IUseAttachmentDropZoneArgs {
	/** El usuario puede soltar archivos ahora mismo (permiso, cupo, estado del documento). */
	canDrop: boolean;
	onFiles: (files: FileList | null) => void;
}

interface IAttachmentDropZoneProps {
	onDragEnter: (event: React.DragEvent<HTMLElement>) => void;
	onDragOver: (event: React.DragEvent<HTMLElement>) => void;
	onDragLeave: (event: React.DragEvent<HTMLElement>) => void;
	onDrop: (event: React.DragEvent<HTMLElement>) => void;
}

interface IUseAttachmentDropZoneResult {
	/** Hay un arrastre de archivos en curso sobre la caja. */
	isDraggingOver: boolean;
	/** Handlers a esparcir sobre el elemento que actúa de caja de destino. */
	dropZoneProps: IAttachmentDropZoneProps;
}

const hasFiles = (event: React.DragEvent<HTMLElement>): boolean =>
	Array.from(event.dataTransfer?.types ?? []).includes('Files');

const useAttachmentDropZone = ({
	canDrop,
	onFiles,
}: IUseAttachmentDropZoneArgs): IUseAttachmentDropZoneResult => {
	const [isDraggingOver, setIsDraggingOver] = useState(false);
	const dragDepthRef = useRef(0);

	const onDragEnter = useCallback(
		(event: React.DragEvent<HTMLElement>) => {
			if (!hasFiles(event)) return;
			event.preventDefault();
			dragDepthRef.current += 1;
			if (canDrop) setIsDraggingOver(true);
		},
		[canDrop],
	);

	const onDragOver = useCallback(
		(event: React.DragEvent<HTMLElement>) => {
			if (!hasFiles(event)) return;
			// Sin preventDefault el navegador abre el archivo en vez de soltarlo acá.
			event.preventDefault();
			// eslint-disable-next-line no-param-reassign -- `dropEffect` sólo se lee vía el propio evento nativo.
			event.dataTransfer.dropEffect = canDrop ? 'copy' : 'none';
		},
		[canDrop],
	);

	const onDragLeave = useCallback((event: React.DragEvent<HTMLElement>) => {
		if (!hasFiles(event)) return;
		event.preventDefault();
		dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
		if (dragDepthRef.current === 0) setIsDraggingOver(false);
	}, []);

	const onDrop = useCallback(
		(event: React.DragEvent<HTMLElement>) => {
			if (!hasFiles(event)) return;
			event.preventDefault();
			dragDepthRef.current = 0;
			setIsDraggingOver(false);
			if (!canDrop) return;
			const droppedFiles = event.dataTransfer.files;
			if (droppedFiles.length > 0) onFiles(droppedFiles);
		},
		[canDrop, onFiles],
	);

	return {
		isDraggingOver,
		dropZoneProps: { onDragEnter, onDragOver, onDragLeave, onDrop },
	};
};

export default useAttachmentDropZone;
