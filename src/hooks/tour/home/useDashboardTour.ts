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
		const palette = colors[themeColor as keyof typeof colors] as
			| Record<string, string>
			| undefined;
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
				element: '#dashboard-stats-sales-week',
				popover: {
					title: 'Ventas de la semana',
					description:
						'<p>Esta tarjeta muestra el total de venta que se han hecho en los últimos 7 días.</p>',
					side: 'bottom',
					align: 'center',
				},
			},
			{
				element: '#dashboard-stats-sales-weekend',
				popover: {
					title: 'Ventas por rango de fecha',
					description:
						'<p>Esta tarjeta muestra el total de venta que se han hecho en el rango de fecha seleccionado.</p>',
					side: 'bottom',
					align: 'center',
				},
			},
			{
				element: '#weekly-sales-header',
				popover: {
					title: 'Rango de fecha Gráfico principal',
					description:
						'<p>Cambiando el rango de fecha en el gráfico principal, puedes ver las ventas de los últimos 7 días.</p>',
					side: 'bottom',
					align: 'center',
				},
			},
			{
				element: '#dashboard-stats-pending',
				popover: {
					title: 'Pendientes',
					description:
						'<p>Esta tarjeta muestra el total de revisiones que se han hecho en los últimos 7 días.</p>',
					side: 'bottom',
					align: 'center',
				},
			},
			{
				element: '#dashboard-stats-reviews-aproved',
				popover: {
					title: 'Aprobados',
					description:
						'<p>Esta tarjeta muestra el total de revisiones que se han hecho históricamente.</p>' +
						'<ul style="list-style:disc;margin-left:18px;margin-top:6px;line-height:1.7;">' +
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
						'<p style="margin-top:8px;opacity:.85;">Aquí puedes ver el estado de cada equipo, revisar pendientes e imprimir etiquetas.</p>',
					side: 'left',
					align: 'start',
				},
			},
			{
				element: '#timeline-toggle',
				popover: {
					title: '🔄 Alternar Vista',
					description:
						'<p>Usa esta <strong>flecha</strong> para cambiar entre la vista de <strong>Revisiones Técnicas</strong> y <strong>Últimas Ventas</strong>.</p>',
					side: 'left',
					align: 'center',
				},
			},
			{
				element: '#timeline-reviews-filters',
				popover: {
					title: '🔍 Filtros de Revisiones',
					description:
						'<p>Filtra los ítems por estado:</p>' +
						'<ul style="list-style:disc;margin-left:18px;margin-top:6px;line-height:1.7;">' +
						'<li><strong>Todos</strong> — muestra todos los ítems</li>' +
						'<li><strong>Pendientes</strong> — ítems en revisión</li>' +
						'<li><strong>Aprobados</strong> — ítems ya aprobados</li>' +
						'</ul>',
					side: 'bottom',
					align: 'center',
				},
			},
			{
				element: '#timeline-reviews-list',
				popover: {
					title: '📋 Lista de Revisiones',
					description:
						'<p>Cada ítem muestra:</p>' +
						'<ul style="list-style:disc;margin-left:18px;margin-top:6px;line-height:1.7;">' +
						'<li><strong>Marca y modelo</strong> del equipo</li>' +
						'<li><strong>Número de serie</strong></li>' +
						'<li><strong>Estado</strong> — aprobado o en revisión</li>' +
						'<li><strong>Revisar</strong> — continúa la revisión pendiente</li>' +
						'<li><strong>Etiqueta</strong> — imprime la etiqueta del equipo</li>' +
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
						'<p>Tabla con las <strong>últimas incorporaciones</strong> al catálogo de productos.</p>',
					side: 'top',
					align: 'center',
				},
			},
			{
				element: '#products-table-header',
				popover: {
					title: '🏷️ Encabezado de Productos',
					description:
						'<p>Resumen de los <strong>productos más recientes</strong> agregados al catálogo.</p>',
					side: 'bottom',
					align: 'start',
				},
			},
			{
				element: '#products-table-body',
				popover: {
					title: '📊 Tabla de Productos',
					description:
						'<p>Aquí puedes ver los detalles de cada producto:</p>' +
						'<ul style="list-style:disc;margin-left:18px;margin-top:6px;line-height:1.7;">' +
						'<li><strong>Producto</strong> — nombre y marca</li>' +
						'<li><strong>SKU</strong> — código único</li>' +
						'<li><strong>Stock</strong> — unidades disponibles</li>' +
						'<li><strong>Precio</strong> — valor del producto</li>' +
						'<li><strong>Estado</strong> — activo o inactivo</li>' +
						'</ul>',
					side: 'top',
					align: 'center',
				},
			},
		];

		// ── scroll to top before starting (body is the scroll container) ──
		document.body.scrollTo({ top: 0, behavior: 'smooth' });
		document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });

		const scrollDelay = setTimeout(() => {
			const isMobile = window.innerWidth <= 640;

			// Override steps configuration for mobile to ensure standard positioning
			const finalSteps: DriveStep[] = steps.map((step) => {
				if (!isMobile) return step;
				return {
					...step,
					popover: {
						...step.popover,
						side: 'bottom' as const,
						align: 'center' as const,
					},
				};
			});

			const driverObj = driver({
				showProgress: true,
				progressText: '{{current}} de {{total}}',
				nextBtnText: isMobile ? '→' : 'Siguiente →',
				prevBtnText: isMobile ? '←' : '← Anterior',
				doneBtnText: '✓ Finalizar',
				animate: true,
				overlayColor: 'black',
				overlayOpacity: 0.5,
				stagePadding: 14,
				stageRadius: 16,
				smoothScroll: true,
				popoverClass: 'zentria-driver-popover',
				allowClose: true,
				disableActiveInteraction: true,
				steps: finalSteps,
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
		}, 500);

		return () => clearTimeout(scrollDelay);
	}, [themeColor, themeColorShade]);

	return { startTour };
};

export default useDashboardTour;
