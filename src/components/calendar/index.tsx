import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import googleCalendarPlugin from '@fullcalendar/google-calendar';
import Modal from '../modal';
import { useCalendarEvents } from './useCalendarEvents';
import { useRef, useState, useEffect } from 'react';

export default function Calendar({ accessToken }: { accessToken: string }) {
	const calendarRef = useRef(null);
	const [calendarKey, setCalendarKey] = useState(0);

	const {
		isModalOpen,
		setIsModalOpen,
		selectedDateTime,
		handleDateClick,
		handleAddEvent,
		loading,
	} = useCalendarEvents(accessToken);

	useEffect(() => {
		const interval = setInterval(() => {
			console.log('Remounting calendar to refresh events...');
			setCalendarKey((prev) => prev + 1);
		}, 60 * 1000);
		return () => clearInterval(interval);
	}, []);

	return (
		<div className='calendar-app' style={{ width: 800 }}>
			{loading && <p>Loading calendar events...</p>}
			<FullCalendar
				plugins={[
					dayGridPlugin,
					timeGridPlugin,
					googleCalendarPlugin,
					interactionPlugin,
				]}
				googleCalendarApiKey={import.meta.env.VITE_GOOGLE_API}
				headerToolbar={{
					left: 'prev,next today',
					center: 'title',
					right: 'dayGridMonth,timeGridWeek,timeGridDay',
				}}
				key={calendarKey}
				ref={calendarRef}
				initialView='dayGridMonth'
				weekends={true} // toggle option?
				eventSources={[
					{
						googleCalendarId: import.meta.env.VITE_GOOGLE_CALENDAR_ID, //dedicated Calendar/user?
					},
					{
						googleCalendarId:
							'en.australian#holiday@group.v.calendar.google.com',
					},
				]}
				handleWindowResize={false}
				height={800}
				dayMaxEvents={true}
				moreLinkClick='popover'
				businessHours={{
					daysOfWeek: [1, 2, 3, 4, 5, 6],
					startTime: '07:30',
					endTime: '18:00',
				}}
				eventTimeFormat={{
					hour: '2-digit',
					minute: '2-digit',
					meridiem: false,
				}}
				slotMinTime='06:00:00'
				slotMaxTime='20:00:00'
				eventClick={(arg) => {
					window.open(arg.event.url, '_blank', 'width=700,height=600');
					arg.jsEvent.preventDefault();
				}}
				dateClick={(event) => {
					if (event.view.type === 'dayGridMonth') {
						return;
					}
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
