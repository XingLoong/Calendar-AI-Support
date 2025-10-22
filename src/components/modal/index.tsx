import React, { useState, useEffect } from 'react';
import { formatLocalDateTime } from './formatLocalTime';
import './modal.css';

const SUMMARY_OPTIONS: SummaryOption[] = [
	{
		label: 'Quote (30 mins)',
		value: 'Quote (30 mins)',
		durationMinutes: 30,
	},
	{
		label: 'Minor Job (2 hours)',
		value: 'Minor Job (2 hours)',
		durationMinutes: 120,
	},
	{
		label: 'Major Job (8 hours)',
		value: 'Major Job (8 hours)',
		durationMinutes: 480,
	},
];

const Modal: React.FC<ModalProps> = ({
	isOpen,
	onClose,
	onSubmit,
	defaultDate,
}) => {
	const [formData, setFormData] = useState<EventData>({
		summary: SUMMARY_OPTIONS[0].value,
		description: '',
		location: '',
		start: '',
		end: '',
	});

	useEffect(() => {
		if (defaultDate) {
			const defaultDuration = SUMMARY_OPTIONS[0].durationMinutes;
			const startLocal = formatLocalDateTime(defaultDate);
			const endLocal = formatLocalDateTime(
				new Date(defaultDate.getTime() + defaultDuration * 60 * 1000),
			); // +30 / 120 / 480 min
			setFormData((prev) => ({
				...prev,
				start: startLocal,
				end: endLocal,
			}));
		}
	}, [defaultDate]);

	useEffect(() => {
		if (!formData.start) return;

		const selectedOption = SUMMARY_OPTIONS.find(
			(option) => option.value === formData.summary,
		);
		const duration = selectedOption?.durationMinutes ?? 30;

		const startDate = new Date(formData.start);
		const newEndDate = new Date(startDate.getTime() + duration * 60 * 1000);

		setFormData((prev) => ({
			...prev,
			end: formatLocalDateTime(newEndDate),
		}));
	}, [formData.summary, formData.start]);

	if (!isOpen) return null;

	const handleChange = (e: React.ChangeEvent<FormFilling>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSubmit(formData);
		onClose();
	};

	return (
		<div className='modal-overlay' onClick={onClose}>
			<div className='modal-container' onClick={(e) => e.stopPropagation()}>
				<h2>Create New Event</h2>
				<form onSubmit={handleSubmit}>
					<label>
						Job Type:
						<select
							name='summary'
							value={formData.summary}
							onChange={handleChange}
						>
							{SUMMARY_OPTIONS.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</label>

					<label>
						Name and Phone:
						<textarea
							name='description'
							value={formData.description}
							onChange={handleChange}
							required
							placeholder='Please enter Name and Phone'
						/>
					</label>

					<label>
						Location:
						<input
							name='location'
							type='text'
							value={formData.location}
							onChange={handleChange}
							required
							placeholder='Please enter address'
						/>
					</label>

					<label>
						Start Time:
						<input
							name='start'
							type='datetime-local'
							value={formData.start}
							onChange={handleChange}
							required
						/>
					</label>

					<label>
						End Time:
						<input
							name='end'
							type='datetime-local'
							value={formData.end}
							onChange={handleChange}
							required
						/>
					</label>

					<div className='modal-buttons'>
						<button type='submit'>Add Event</button>
						<button type='button' onClick={onClose}>
							Cancel
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default Modal;
