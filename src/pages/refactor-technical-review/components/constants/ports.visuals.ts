/**
 * ports.visuals.ts
 * Icono y color de cada tipo de puerto, para las grillas que muestran los contadores
 * dentro de una tarjeta (aio, docking y monitor).
 *
 * Vive aparte del catálogo (`ports.rules.ts`) porque es presentación: el catálogo dice qué
 * puertos existen y cómo se llaman sus campos, esto sólo dice cómo se pintan. Están los
 * nueve tipos, así que agregar uno al catálogo no deja una tarjeta sin estilo.
 *
 * `icon` se tipa como `TDuotoneIcons` y no como `TIcons`: `TIcons` incluye `string`, así que
 * aceptaba nombres que `resolveIconLoader` (`@/components/icon/Icon`) no sabe resolver y que
 * terminaban sin dibujar nada y sin error en consola. La unión duotone es la lista de los
 * archivos de `@/components/icon/duotone` con el prefijo `Duo`, de modo que un nombre
 * inexistente ahora no compila.
 */
import type { TDuotoneIcons } from '@/types/duotoneIcons.type';

import type { PortTypeValue } from '../validation/constants/ports.rules';

export interface PortCounterVisual {
	icon: TDuotoneIcons;
	color: string;
}

export const PORT_COUNTER_VISUALS: Record<PortTypeValue, PortCounterVisual> = {
	vga: { icon: 'DuoDisplay1', color: 'orange' },
	hdmi: { icon: 'DuoTv1', color: 'emerald' },
	displayport: { icon: 'DuoDisplay2', color: 'indigo' },
	dvi: { icon: 'DuoDisplay3', color: 'violet' },
	usb_a: { icon: 'DuoUsb', color: 'blue' },
	usb_c: { icon: 'DuoUsbStorage', color: 'fuchsia' },
	sd_reader: { icon: 'DuoSdCard', color: 'zinc' },
	rj45: { icon: 'DuoRouter1', color: 'cyan' },
	charging: { icon: 'DuoBatteryCharging', color: 'amber' },
};
