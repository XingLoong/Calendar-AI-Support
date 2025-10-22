import React, { useState, useEffect } from 'react';
import AIAssistant from '../AI-Helper';
import { fetchEvents } from '../google/useGoogleCalendar';
import robo from '../../assets/ai-white.svg';
import './sidebar.css';

const FloatingSidebar: React.FC<FloatingSidebarProps> = ({
	accessToken,
}: {
	accessToken: string;
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const [events, setEvents] = useState<CalendarEvent[]>([]);

	useEffect(() => {
		const loadEvents = async () => {
			try {
				const fetched = await fetchEvents(accessToken);
				setEvents(fetched || []);
			} catch (err) {
				console.error('Error fetching calendar events:', err);
			}
		};

		if (accessToken) loadEvents();
	}, [accessToken]);

	return (
		<>
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
				/>{' '}
			</button>

			{isOpen && (
				<>
					<div className='overlay' onClick={() => setIsOpen(false)} />

					<div className={`sidebar ${isOpen ? 'open' : ''}`}>
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
							<AIAssistant events={events} />
						</div>
					</div>
				</>
			)}
		</>
	);
};

export default FloatingSidebar;
