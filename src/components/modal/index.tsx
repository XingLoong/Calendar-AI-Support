import React, { useState, useEffect } from 'react';
import { formatLocalDateTime } from './formatLocalTime';
import './modal.css';

const SUMMARY_OPTIONS: SummaryOption[] = [
	{ label: 'Quote (30 mins)', value: 'Quote (30 mins)', durationMinutes: 30 },
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

const initialFormState = {
	summary: SUMMARY_OPTIONS[0].value,
	description: '',
	location: '',
	start: '',
	end: '',
};

const Modal: React.FC<ModalProps> = ({
	isOpen,
	onClose,
	onSubmit,
	defaultDate,
}) => {
	const [formData, setFormData] = useState<EventData>(initialFormState);
	const [show, setShow] = useState(false);
	const [closing, setClosing] = useState(false);

	// handle mount/unmount timing
	useEffect(() => {
		if (isOpen) {
			setShow(true);
			setClosing(false);
		} else if (show) {
			setClosing(true);
			const timer = setTimeout(() => {
				setShow(false);
				setClosing(false);
			}, 200); // match CSS transition time
			return () => clearTimeout(timer);
		}
	}, [isOpen, show]);

	// prefill times
	useEffect(() => {
		if (defaultDate) {
			const duration = SUMMARY_OPTIONS[0].durationMinutes;
			const start = formatLocalDateTime(defaultDate);
			const end = formatLocalDateTime(
				new Date(defaultDate.getTime() + duration * 60 * 1000),
			);
			setFormData((prev) => ({ ...prev, start, end }));
		}
	}, [defaultDate]);

	// update end when job type changes
	useEffect(() => {
		if (!formData.start) return;
		const selected = SUMMARY_OPTIONS.find((o) => o.value === formData.summary);
		const duration = selected?.durationMinutes ?? 30;
		const startDate = new Date(formData.start);
		const endDate = new Date(startDate.getTime() + duration * 60 * 1000);
		setFormData((prev) => ({ ...prev, end: formatLocalDateTime(endDate) }));
	}, [formData.summary, formData.start]);

	// escape key
	useEffect(() => {
		if (!isOpen) return;
		const handleKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				setFormData(initialFormState);
				onClose();
			}
		};
		window.addEventListener('keydown', handleKey);
		return () => window.removeEventListener('keydown', handleKey);
	}, [isOpen, onClose]);

	if (!show) return null;

	const handleChange = (e: React.ChangeEvent<FormFilling>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSubmit(formData);
		handleCancel();
	};

	const handleCancel = () => {
		setFormData(initialFormState);
		onClose();
	};

	return (
		<div
			className={`modal-overlay ${isOpen && !closing ? 'open' : 'closing'}`}
			onClick={handleCancel}
		>
			<div
				className={`modal-container ${isOpen && !closing ? 'open' : 'closing'}`}
				onClick={(e) => e.stopPropagation()}
			>
				<h2>Create New Event</h2>
				<form onSubmit={handleSubmit}>
					<label>
						Job Type:
						<select
							name='summary'
							value={formData.summary}
							onChange={handleChange}
						>
							{SUMMARY_OPTIONS.map((o) => (
								<option key={o.value} value={o.value}>
									{o.label}
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
						<button type='button' onClick={handleCancel}>
							Cancel
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default Modal;
