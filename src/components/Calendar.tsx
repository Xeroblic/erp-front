import _ from 'lodash';
import FullCalendar, {
	CalendarOptions,
	LocaleInput,
	PluginInput,
	ToolbarInput,
} from '@fullcalendar/react';
import themePlugin from '@fullcalendar/react/themes/classic';
import dayGridPlugin from '@fullcalendar/react/daygrid';
import timeGridPlugin from '@fullcalendar/react/timegrid';
import listPlugin from '@fullcalendar/react/list';
import interactionPlugin from '@fullcalendar/react/interaction';
import esLocale from '@fullcalendar/react/locales/es';
import trLocale from '@fullcalendar/react/locales/tr';
import arLocale from '@fullcalendar/react/locales/ar';
import '@fullcalendar/react/skeleton.css';
import '@fullcalendar/react/themes/classic/theme.css';
import '@fullcalendar/react/themes/classic/palette.css';
import colors from 'tailwindcss/colors';
import theme from 'tailwindcss/defaultTheme';
import { useTranslation } from 'react-i18next';
import themeConfig from '../config/theme.config';

export type TViewMode = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek' | string;

interface ICalendarProps extends Partial<CalendarOptions> {
	viewMode?: TViewMode;
	plugins?: PluginInput[];
	headerToolbar?: ToolbarInput;
	eventColor?: string;
	locales?: LocaleInput[];
}
const Calendar = (props: ICalendarProps) => {
	const {
		plugins,
		viewMode = 'dayGridMonth',
		headerToolbar,
		eventColor = colors[themeConfig.themeColor][themeConfig.themeColorShade],
		locale,
		locales,
		datesSet,
		...rest
	} = props;

	const { i18n } = useTranslation();

	return (
		<>
			<style>{`
				.zentria-calendar-toolbar {
					${typeof headerToolbar === 'undefined' ? 'margin: 0 !important' : ''}
				}
				.zentria-calendar-daygrid-event {
					border-radius: 100px;
				}
				.zentria-calendar-event-inner {
					display: flex;
					align-items: center;
				}
				.zentria-calendar-table,
				.zentria-calendar-list {
					border-radius: ${theme.borderRadius.md};
					overflow: hidden;
				}
				:root {
					--fc-classic-background: transparent;
					--fc-classic-foreground: currentColor;
					--fc-classic-border: ${colors.zinc['500']}50;
					--fc-classic-today: ${colors.blue['500']}20;
					--fc-classic-muted: ${colors.blue['500']};
				}
			`}</style>
			<FullCalendar
				locale={locale || i18n.language}
				locales={[esLocale, trLocale, arLocale, ...(locales ?? [])]}
				plugins={[
					themePlugin,
					dayGridPlugin,
					timeGridPlugin,
					listPlugin,
					interactionPlugin,
					...(plugins ?? []),
				]}
				initialView={viewMode}
				datesSet={datesSet}
				headerToolbar={_.merge(
					{
						start: '',
						center: '',
						end: '',
					},
					headerToolbar,
				)}
				headerToolbarClass='zentria-calendar-toolbar'
				eventInnerClass='zentria-calendar-event-inner'
				views={{
					dayGrid: {
						eventClass: 'zentria-calendar-daygrid-event',
						tableBodyClass: 'zentria-calendar-table',
					},
					list: { className: 'zentria-calendar-list' },
				}}
				eventColor={eventColor}
				{...rest}
			/>
		</>
	);
};

export default Calendar;
