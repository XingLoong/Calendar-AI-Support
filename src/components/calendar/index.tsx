import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import googleCalendarPlugin from '@fullcalendar/google-calendar';
import Modal from '../modal';
import { useCalendarEvents } from './useCalendarEvents';

export default function Calendar({ accessToken }: { accessToken: string }) {
	const {
		isModalOpen,
		setIsModalOpen,
		selectedDateTime,
		handleDateClick,
		handleAddEvent,
		loading,
	} = useCalendarEvents(accessToken);

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
				eventTimeFormat={{
					hour: '2-digit',
					minute: '2-digit',
					meridiem: false,
				}}
				handleWindowResize={false}
				height={800}
				dayMaxEvents={true}
				moreLinkClick='popover'
				businessHours={{
					daysOfWeek: [1, 2, 3, 4, 5, 6],
					startTime: '07:30',
					endTime: '18:00',
				}}
				slotMinTime='06:00:00'
				slotMaxTime='20:00:00'
				eventClick={(arg) => {
					window.open(arg.event.url, '_blank', 'width=700,height=600');
					arg.jsEvent.preventDefault();
				}}
				// dateClick={handleDateClick}
				dateClick={(event) => {
					if (event.view.type === 'dayGridMonth') {
						return;
					}
					if (event.view.type === 'timeGridWeek') {
						handleDateClick(event);
					}
				}}
				// dateClick={(event) => {
				//     if () {}
				// }}
				// info.view.type === 'dayGridMonth' ? 'timeGridWeek' : do nothing
				//     dateClick: function(info) {
				//          console.log(info)}
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
