import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import googleCalendarPlugin from '@fullcalendar/google-calendar';
import type { DatesSetArg } from '@fullcalendar/core';
import Modal from '../modal';
import { useCalendarEvents } from './useCalendarEvents';
import { useRef, useState, useEffect, useCallback } from 'react';

export default function Calendar({ accessToken }: { accessToken: string }) {
	const calendarRef = useRef<FullCalendar | null>(null);
	const [calendarKey, setCalendarKey] = useState(0);
	const [calendarView, setCalendarView] = useState(
		localStorage.getItem('calendarView') || 'dayGridMonth',
	);
	const [calendarDate, setCalendarDate] = useState<string | undefined>(
		localStorage.getItem('calendarDate') || undefined,
	);

	const handleCalendarRefresh = useCallback(() => {
		setCalendarKey((prev) => prev + 1);
	}, []);

	const {
		isModalOpen,
		setIsModalOpen,
		selectedDateTime,
		handleDateClick,
		handleAddEvent,
		loading,
	} = useCalendarEvents(accessToken, handleCalendarRefresh);

	// ✅ Save view + date every time the view changes
	const handleViewChange = (viewInfo: DatesSetArg) => {
		const viewType = viewInfo.view.type;
		const startDate = viewInfo.startStr;

		setCalendarView(viewType);
		setCalendarDate(startDate);
		localStorage.setItem('calendarView', viewType);
		localStorage.setItem('calendarDate', startDate);
	};

	// Auto-refresh events periodically
	useEffect(() => {
		const interval = setInterval(() => {
			console.log('5 min auto-refresh');
			setCalendarKey((prev) => prev + 1);
		}, 5 * 60 * 1000);
		return () => clearInterval(interval);
	}, []);

	return (
		<div className='calendar-app' style={{ width: 800 }}>
			{loading && <p>Loading calendar events...</p>}

			<FullCalendar
				key={calendarKey}
				ref={calendarRef}
				plugins={[
					dayGridPlugin,
					timeGridPlugin,
					interactionPlugin,
					googleCalendarPlugin,
				]}
				googleCalendarApiKey={import.meta.env.VITE_GOOGLE_API}
				headerToolbar={{
					left: 'prev,next today',
					center: 'title',
					right: 'dayGridMonth,timeGridWeek,timeGridDay',
				}}
				initialView={calendarView}
				initialDate={calendarDate}
				datesSet={handleViewChange}
				weekends={true}
				eventSources={[
					{ googleCalendarId: import.meta.env.VITE_GOOGLE_CALENDAR_ID },
					{
						googleCalendarId:
							'en.australian#holiday@group.v.calendar.google.com',
					},
				]}
				handleWindowResize={false}
				height={800}
				dayMaxEvents={true}
				moreLinkClick='popover'
				businessHours={[
					{
						daysOfWeek: [1, 2, 3, 4, 5],
						startTime: '07:30',
						endTime: '18:00',
					},
					{
						daysOfWeek: [6],
						startTime: '08:00',
						endTime: '17:00',
					},
				]}
				timeZone='local'
				eventTimeFormat={{
					hour: '2-digit',
					minute: '2-digit',
					hour12: false,
				}}
				slotMinTime='06:00:00'
				slotMaxTime='20:00:00'
				eventClick={(arg) => {
					window.open(arg.event.url, '_blank', 'width=700,height=600');
					arg.jsEvent.preventDefault();
				}}
				dateClick={(event) => {
					if (event.view.type === 'timeGridWeek') {
						handleDateClick(event);
					}
				}}
			/>

			<Modal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				onSubmit={handleAddEvent}
				defaultDate={selectedDateTime ?? undefined}
			/>
		</div>
	);
}
