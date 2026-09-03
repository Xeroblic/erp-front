/**
 * ports.visuals.ts
 * Icono y color de cada tipo de puerto, para las grillas que muestran los contadores
 * dentro de una tarjeta (aio, docking y monitor).
 *
 * Vive aparte del catálogo (`ports.rules.ts`) porque es presentación: el catálogo dice qué
 * puertos existen y cómo se llaman sus campos, esto sólo dice cómo se pintan. Están los
 * nueve tipos, así que agregar uno al catálogo no deja una tarjeta sin estilo.
 */
import type { PortTypeValue } from '../validation/constants/ports.rules';

export interface PortCounterVisual {
	icon: string;
	color: string;
}

export const PORT_COUNTER_VISUALS: Record<PortTypeValue, PortCounterVisual> = {
	vga: { icon: 'Video', color: 'orange' },
	hdmi: { icon: 'DeviceTv', color: 'emerald' },
	displayport: { icon: 'MonitorSpeaker', color: 'indigo' },
	dvi: { icon: 'Cable', color: 'violet' },
	usb_a: { icon: 'UsbSymbol', color: 'blue' },
	usb_c: { icon: 'UsbCable', color: 'fuchsia' },
	sd_reader: { icon: 'SdCard', color: 'zinc' },
	rj45: { icon: 'Router', color: 'cyan' },
	charging: { icon: 'Bolt', color: 'amber' },
};
