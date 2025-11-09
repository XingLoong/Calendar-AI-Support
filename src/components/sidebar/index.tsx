import { useState, useEffect } from 'react';
import AIAssistant from '../AI-Helper';
import robo from '../../assets/ai-white.svg';
import './sidebar.css';

const FloatingSidebar = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [events, setEvents] = useState<CalendarEvent[]>([]);
	const [loadingEvents, setLoadingEvents] = useState(true);

	// Fetch events from API on mount
	useEffect(() => {
		const fetchEvents = async () => {
			try {
				const res = await fetch('/api/events');
				if (!res.ok) throw new Error('Failed to fetch events');
				const data = await res.json();

				// Transform API data to match useEventContext format
				const ev = (data.events || []).map((e: CalendarEvent) => ({
					id: e.id,
					summary: e.summary ?? 'Untitled Event',
					start: e.start,
					end: e.end,
					location: e.location ?? '',
					description: e.description ?? '',
				}));
				setEvents(ev);
			} catch (err) {
				console.error('Error fetching events:', err);
			} finally {
				setLoadingEvents(false);
			}
		};
		fetchEvents();
	}, []);

	return (
		<>
			{/* Floating button */}
			{!isOpen && (
				<button className='floating-button' onClick={() => setIsOpen(true)}>
					<img
						src={robo}
						alt='AI icon'
						style={{
							width: '90px',
							height: '90px',
							marginLeft: '-10px',
							marginTop: '-5px',
						}}
					/>
				</button>
			)}

			{/* Sidebar */}
			{isOpen && (
				<div className='overlay'>
					<div
						className={`sidebar ${isOpen ? 'open' : ''}`}
						onClick={(event) => event.stopPropagation()}
					>
						<div className='sidebar-header'>
							<h2>AI auto-helper</h2>
							<button
								className='close-button'
								onClick={() => setIsOpen(false)}
								aria-label='Close sidebar'
							>
								× Close
							</button>
						</div>

						<div className='sidebar-content'>
							<p className='mb-3 text-sm text-gray-600'>
								What would you like help with today?
							</p>

							{/* Pass events to AI assistant */}
							{loadingEvents ? (
								<p className='text-gray-500'>Loading calendar events...</p>
							) : (
								<AIAssistant events={events} />
							)}
						</div>
					</div>
				</div>
			)}
		</>
	);
};

export default FloatingSidebar;
