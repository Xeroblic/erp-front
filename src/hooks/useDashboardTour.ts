import { useCallback } from 'react';
import { driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import colors from 'tailwindcss/colors';
import { useAppSelector } from '@/store';
import {
	selectThemeColor,
	selectThemeColorShade,
} from '@/store/slices/personalizacion/personalizacionSlice';

/**
 * Hook that provides a `startTour()` function to launch a driver.js
 * guided tour of the Dashboard page.
 *
 * Popover colours are resolved dynamically from the current theme colour
 * configured via the personalization slice / ThemeContext.
 */
const useDashboardTour = () => {
	const themeColor = useAppSelector(selectThemeColor);
	const themeColorShade = useAppSelector(selectThemeColorShade);

	const startTour = useCallback(() => {
		// ── resolve hex colours from tailwind palette ──
		const palette = colors[themeColor as keyof typeof colors] as Record<string, string> | undefined;
		const primary = palette?.[themeColorShade] ?? '#10b981';
		const primaryLight = palette?.['400'] ?? '#34d399';
		const primaryDark = palette?.['700'] ?? '#047857';

		// ── tour steps ──
		const steps: DriveStep[] = [
			{
				element: '#dashboard-header',
				popover: {
					title: '👋 ¡Bienvenido al Dashboard!',
					description:
						'<p>Este es el <strong>centro de operaciones</strong> de tu empresa.</p>' +
						'<p style="margin-top:8px;opacity:.85;">Desde aquí puedes monitorear ventas, revisiones técnicas, productos y más — todo en tiempo real.</p>',
					side: 'bottom',
					align: 'start',
				},
			},
			{
				element: '#dashboard-stats',
				popover: {
					title: '📊 Indicadores Clave',
					description:
						'<p>Estas tarjetas muestran los <strong>KPIs principales</strong>:</p>' +
						'<ul style="list-style:disc;margin-left:18px;margin-top:6px;line-height:1.7;">' +
						'<li><strong>Ventas Semana</strong> — órdenes de los últimos 7 días</li>' +
						'<li><strong>Monto Semana</strong> — ingresos del período</li>' +
						'<li><strong>Pendientes</strong> — revisiones por realizar</li>' +
						'<li><strong>Aprobados</strong> — total histórico aprobado</li>' +
						'</ul>',
					side: 'bottom',
					align: 'center',
				},
			},
			{
				element: '#dashboard-chart',
				popover: {
					title: '📈 Gráfico de Ventas',
					description:
						'<p>Visualiza la <strong>evolución de tus ingresos</strong> con el gráfico interactivo.</p>' +
						'<ul style="list-style:disc;margin-left:18px;margin-top:6px;line-height:1.7;">' +
						'<li><strong>7D / 30D</strong> — alterna entre vista semanal y mensual</li>' +
						'<li><strong>Exportar</strong> — descarga los datos en XML</li>' +
						'<li><strong>Monto total</strong> — acumulado del período</li>' +
						'</ul>',
					side: 'bottom',
					align: 'start',
				},
			},
			{
				element: '#dashboard-timeline',
				popover: {
					title: '🕐 Últimos Ítems',
					description:
						'<p>Línea de tiempo de las <strong>revisiones y ventas recientes</strong>.</p>' +
						'<ul style="list-style:disc;margin-left:18px;margin-top:6px;line-height:1.7;">' +
						'<li><strong>Revisar</strong> — continúa revisiones pendientes</li>' +
						'<li><strong>Etiqueta</strong> — imprime etiquetas de equipos aprobados</li>' +
						'<li>Usa la <strong>flecha</strong> para alternar entre revisiones y ventas</li>' +
						'</ul>',
					side: 'left',
					align: 'start',
				},
			},
			{
				element: '#dashboard-products',
				popover: {
					title: '📦 Últimos Productos',
					description:
						'<p>Tabla con las <strong>últimas incorporaciones</strong> al catálogo de productos.</p>' +
						'<ul style="list-style:disc;margin-left:18px;margin-top:6px;line-height:1.7;">' +
						'<li>Busca por nombre, SKU o marca</li>' +
						'<li>Filtra por stock y estado</li>' +
						'<li>Acceso rápido a edición</li>' +
						'</ul>',
					side: 'top',
					align: 'center',
				},
			},
		];

		// ── create & start driver ──
		const driverObj = driver({
			showProgress: true,
			progressText: '{{current}} de {{total}}',
			nextBtnText: 'Siguiente →',
			prevBtnText: '← Anterior',
			doneBtnText: '✓ Finalizar',
			animate: true,
			overlayColor: 'black',
			overlayOpacity: 0.5,
			stagePadding: 14,
			stageRadius: 16,
			popoverClass: 'zentria-driver-popover',
			allowClose: true,
			steps,
			onPopoverRender: (popover) => {
				const wrapper = popover.wrapper as HTMLElement;
				if (wrapper) {
					wrapper.style.setProperty('--driver-theme-primary', primary);
					wrapper.style.setProperty('--driver-theme-light', primaryLight);
					wrapper.style.setProperty('--driver-theme-dark', primaryDark);
				}
			},
		});

		driverObj.drive();
	}, [themeColor, themeColorShade]);

	return { startTour };
};

export default useDashboardTour;
