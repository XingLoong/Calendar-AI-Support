import './App.css';
import Calendar from './components/calendar';
import GoogleLoginButton from './components/Auth/GoogleLoginButton';
import FloatingSidebar from './components/sidebar';
import ConsoleSilencer from './components/utils/ConsoleSilencer';
import { useState } from 'react';
import { useTokenExpiry } from './components/Auth/useTokenExpiry';

function App() {
	const [accessToken, setAccessToken] = useState<string | null>(
		sessionStorage.getItem('google_access_token'),
	);

	const handleLoginSuccess = (token: string) => {
		sessionStorage.setItem('google_access_token', token);
		setAccessToken(token);
	};

	const handleLogout = () => {
		sessionStorage.removeItem('google_access_token');
		sessionStorage.removeItem('token_issue_time');
		setAccessToken(null);
	};

	const { showPrompt, refreshToken, dismissPrompt } = useTokenExpiry({
		accessToken,
		onRefresh: handleLoginSuccess,
		onLogout: handleLogout,
		clientId: import.meta.env.VITE_GOOGLE_CLIENT,
		scope: 'https://www.googleapis.com/auth/calendar',
	});

	return (
		<div>
			<ConsoleSilencer />
			<h1>AI Calendar App</h1>

			{!accessToken ? (
				<GoogleLoginButton
					clientId={import.meta.env.VITE_GOOGLE_CLIENT}
					scope='https://www.googleapis.com/auth/calendar'
					onLoginSuccess={handleLoginSuccess}
				/>
			) : (
				<>
					<Calendar accessToken={accessToken} />
					<FloatingSidebar accessToken={accessToken} />
					<br />
					<button
						onClick={handleLogout}
						className='absolute top-4 right-4 bg-gray-700 text-white px-3 py-1 rounded-md hover:bg-gray-800'
					>
						Log out
					</button>
				</>
			)}

			{/* Session Expiry Prompt */}
			{showPrompt && (
				<div className='fixed bottom-6 right-6 bg-yellow-100 border border-yellow-400 rounded-lg shadow-md p-4 flex items-center gap-3 z-[1000]'>
					<span>⚠️ Your session will expire soon. Refresh now?</span>
					<button
						onClick={refreshToken}
						className='bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600'
					>
						Refresh
					</button>
					<button
						onClick={() => {
							dismissPrompt();
							handleLogout();
						}}
						className='bg-gray-200 text-gray-800 px-3 py-1 rounded hover:bg-gray-300'
					>
						Log out
					</button>
				</div>
			)}
		</div>
	);
}

export default App;
