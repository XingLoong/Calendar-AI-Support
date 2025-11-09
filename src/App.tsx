import './App.css';
import Calendar from './components/calendar';
import FloatingSidebar from './components/sidebar';
import ConsoleSilencer from './components/utils/ConsoleSilencer';

function App() {
	return (
		<div>
			<ConsoleSilencer />
			<h1>AI Calendar App</h1>

			<>
				<Calendar />
				<FloatingSidebar />
				<br />
			</>
		</div>
	);
}
export default App;
