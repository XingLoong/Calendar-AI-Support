import { useState, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import googleCalendarPlugin from '@fullcalendar/google-calendar';
import type { DateClickArg } from '@fullcalendar/interaction';
import Modal from '../modal';

export default function Calendar() {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedDate, setSelectedDate] = useState<Date | null>(null);
	const calendarRef = useRef<FullCalendar>(null);

	const handleDateClick = (event: DateClickArg) => {
		setSelectedDate(event.date);
		setIsModalOpen(true);
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
		setSelectedDate(null);
	};

	const handleSubmit = async (formData: CalendarEventInput) => {
		try {
			// Call serverless API
			const response = await fetch('/api/events', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData),
			});

			if (!response.ok) {
				const err = await response.json();
				console.error('Error creating event:', err);
				return;
			}

			const data = await response.json();
			console.log('Event created:', data);

			// Optional: refresh events in FullCalendar
			calendarRef.current?.getApi().refetchEvents();
		} catch (err) {
			console.error('Error submitting event:', err);
		}
	};

	return (
		<div className='calendar-app' style={{ width: 800 }}>
			<FullCalendar
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
				initialView='timeGridWeek'
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
				onClose={handleCloseModal}
				onSubmit={handleSubmit}
				defaultDate={selectedDate ?? undefined}
			/>
		</div>
	);
}
