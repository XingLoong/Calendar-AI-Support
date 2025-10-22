import './App.css';
import Calendar from './components/calendar';
import GoogleLoginButton from './components/Auth/GoogleLoginButton';
import { useState } from 'react';

function App() {
	const [accesstoken, setAccessToken] = useState<string | null>(null);

	const handleLoginSuccess = (accessToken: string) => {
		setAccessToken(accessToken);
	};

	return (
		<div>
			<h1>AI Calendar App</h1>

			{!accesstoken ? (
				<GoogleLoginButton
					clientId={import.meta.env.VITE_GOOGLE_CLIENT}
					scope='https://www.googleapis.com/auth/calendar'
					onLoginSuccess={handleLoginSuccess}
				/>
			) : (
				<Calendar accessToken={accesstoken} />
			)}
		</div>
	);
}

export default App;
