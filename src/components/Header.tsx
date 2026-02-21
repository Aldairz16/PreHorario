import React from 'react';
import { useCalendar } from '../context/CalendarContext';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Menu } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const Header: React.FC = () => {
    const { state, dispatch } = useCalendar();

    const prevMonth = () => {
        dispatch({ type: 'SET_MONTH_INDEX', payload: state.monthIndex - 1 });
    };

    const nextMonth = () => {
        dispatch({ type: 'SET_MONTH_INDEX', payload: state.monthIndex + 1 });
    };

    const today = () => {
        dispatch({ type: 'SET_MONTH_INDEX', payload: new Date().getMonth() });
        dispatch({ type: 'SET_YEAR', payload: new Date().getFullYear() });
    };

    const currentDate = new Date(state.year, state.monthIndex);

    return (
        <header className="header flex items-center px-4 py-2 bg-white border-b border-gray-200">
            <div className="flex items-center gap-2 mr-8">
                <button className="icon-btn" aria-label="Menu">
                    <Menu size={24} />
                </button>
                <div className="flex items-center gap-2">
                    <CalendarIcon size={24} className="text-blue-600" />
                    <h1 className="text-xl font-normal text-gray-700 hidden sm:block">Calendar</h1>
                </div>
            </div>

            <div className="flex items-center gap-2 mr-4">
                <button onClick={today} className="cursor-pointer border border-gray-300 rounded-md px-4 py-2 hover:bg-gray-50 text-sm font-medium">
                    Hoy
                </button>
                <button onClick={prevMonth} className="icon-btn" aria-label="Previous month">
                    <ChevronLeft size={20} />
                </button>
                <button onClick={nextMonth} className="icon-btn" aria-label="Next month">
                    <ChevronRight size={20} />
                </button>
            </div>

            <h2 className="text-xl font-medium text-gray-700">
                {format(currentDate, 'MMMM yyyy', { locale: es }).replace(/^\w/, (c) => c.toUpperCase())}
            </h2>

            <div className="flex-1"></div>

            {/* Search and settings could go here */}
        </header>
    );
};
