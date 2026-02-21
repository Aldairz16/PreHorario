import { CalendarProvider } from './context/CalendarContext';
import { WeeklyView } from './components/WeeklyView';
import { EventModal } from './components/EventModal';

function App() {
    return (
        <CalendarProvider>
            <div className="flex flex-col h-screen bg-gray-900 text-gray-100">
                <div className="flex-1 overflow-hidden shadow-lg m-4 rounded-xl border border-gray-700 bg-gray-800">
                    <WeeklyView />
                </div>
                <EventModal />
            </div>
        </CalendarProvider>
    );
}

export default App;
