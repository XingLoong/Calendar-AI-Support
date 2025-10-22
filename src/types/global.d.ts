interface GoogleOAuthResponse {
	access_token: string;
	expires_in?: number;
	token_type?: string;
	scope?: string;
}

interface GoogleTokenClientConfig {
	client_id: string;
	scope: string;
	callback: (response: GoogleOAuthResponse) => void;
}

interface GoogleAccountsOAuth2 {
	initTokenClient: (config: GoogleTokenClientConfig) => {
		requestAccessToken: () => void;
	};
}

interface GoogleAccounts {
	oauth2: GoogleAccountsOAuth2;
}

interface Google {
	accounts: GoogleAccounts;
}

interface Window {
	google?: Google;
}

interface CalendarEvent {
	// grabbing
	id?: string;
	summary: string;
	start?: { date?: string; dateTime?: string } | Date;
	end?: { date?: string; dateTime?: string } | Date;
	location: string;
	description: string;
}

interface CalendarEventInput {
	// adding
	summary: string;
	description?: string;
	location?: string;
	start: string | Date; // local form data, simple
	end: string | Date;
}

interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (data: EventData) => void;
	defaultDate?: Date;
}

interface EventData {
	summary: string;
	description: string;
	location: string;
	start: string;
	end: string;
}

interface SummaryOption {
	label: string;
	value: string;
	durationMinutes: number;
}

interface FloatingSidebarProps {
	accessToken: string;
}

interface GeminiResponse {
	text?: string | (() => Promise<string> | string);
	candidates?: Array<{
		content?: { parts?: Array<{ text?: string }> };
		text?: string;
	}>;
	output?: Array<{
		content?: { parts?: Array<{ text?: string }> };
	}>;
	output_text?: string;
}

interface Message {
	role: 'user' | 'assistant';
	content: string;
}

interface ChatMessagesProps {
	messages: Message[];
	loading?: boolean;
}

type FormFilling = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
