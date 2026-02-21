import React, { useState } from 'react';
import { useCalendar, CalendarEvent } from '../context/CalendarContext';
import { getMonthMatrix } from '../utils/dateUtils';
import { format, isSameDay, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';

export const CalendarGrid: React.FC = () => {
    const { state } = useCalendar();
    const currentMonthDays = getMonthMatrix(state.year, state.monthIndex);

    return (
        <div className="flex-1 grid grid-cols-7 grid-rows-6">
            {currentMonthDays.map((day, i) => (
                <Day key={i} day={day} rowIndex={Math.floor(i / 7)} />
            ))}
        </div>
    );
};

const Day: React.FC<{ day: Date; rowIndex: number }> = ({ day, rowIndex }) => {
    const { state, dispatch } = useCalendar();
    const dayEvents = state.savedEvents.filter((evt) =>
        isSameDay(day, new Date(evt.start))
    );

    const isSelected = state.selectedDate === day.getTime();
    const isCurrentMonth = isSameMonth(day, new Date(state.year, state.monthIndex));
    const isToday = isSameDay(day, new Date());

    const handleDayClick = () => {
        dispatch({ type: 'SET_SELECTED_DATE', payload: day.getTime() });
        dispatch({ type: 'TOGGLE_EVENT_MODAL', payload: true });
        dispatch({ type: 'SET_SELECTED_EVENT', payload: null });
    };

    return (
        <div
            onClick={handleDayClick}
            className={`border border-gray-100 flex flex-col cursor-pointer transition-colors hover:bg-gray-50
        ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}
        ${isSelected ? 'bg-blue-50' : ''}
      `}
            style={{ minHeight: '100px' }}
        >
            <header className="flex flex-col items-center p-1">
                {rowIndex === 0 && (
                    <p className="text-sm font-medium text-gray-500 mb-1 uppercase">
                        {format(day, 'EEE', { locale: es })}
                    </p>
                )}
                <p
                    className={`text-sm p-1 my-1 text-center rounded-full w-7 h-7 flex items-center justify-center
            ${isToday ? 'bg-blue-600 text-white' : ''}
          `}
                >
                    {format(day, 'd')}
                </p>
            </header>

            <div className="flex-1 w-full">
                {dayEvents.map((evt, idx) => (
                    <div
                        key={idx}
                        onClick={(e) => {
                            e.stopPropagation();
                            dispatch({ type: 'SET_SELECTED_EVENT', payload: evt });
                            dispatch({ type: 'TOGGLE_EVENT_MODAL', payload: true });
                        }}
                        className={`mx-1 px-2 py-1 text-xs rounded mb-1 truncate event-${evt.color} cursor-pointer hover:opacity-80`}
                    >
                        {evt.title}
                    </div>
                ))}
            </div>
        </div>
    );
};
