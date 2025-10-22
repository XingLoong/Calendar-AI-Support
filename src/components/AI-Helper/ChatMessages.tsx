import React from 'react';

export const ChatMessages: React.FC<ChatMessagesProps> = ({
	messages,
	loading,
}) => (
	<div className='flex-1 overflow-y-auto space-y-2 mb-3'>
		{messages.map((m, i) => (
			<div
				key={i}
				className={`p-2 rounded-lg ${
					m.role === 'user' ? 'bg-blue-100 self-end' : 'bg-white border'
				}`}
			>
				<p
					className='text-sm whitespace-pre-wrap'
					dangerouslySetInnerHTML={{ __html: m.content }}
				/>{' '}
			</div>
		))}
		{loading && <p className='text-gray-400 text-sm italic'>Thinking...</p>}
	</div>
);
