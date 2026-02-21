import React, { useState, useEffect } from 'react';
import { useCalendar, CalendarEvent } from '../context/CalendarContext';
import { X, Clock, AlignLeft, Check, CalendarDays } from 'lucide-react';
import { format, setHours, setMinutes, getDay } from 'date-fns';

const colors = [
    'blue',
    'green',
    'purple',
    'red',
    'yellow',
];

const dayLabels = [
    { label: 'D', value: 0 },
    { label: 'L', value: 1 },
    { label: 'M', value: 2 },
    { label: 'M', value: 3 },
    { label: 'J', value: 4 },
    { label: 'V', value: 5 },
    { label: 'S', value: 6 },
];

export const EventModal: React.FC = () => {
    const { state, dispatch } = useCalendar();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedColor, setSelectedColor] = useState(colors[0]);

    // Time state
    const [startTime, setStartTime] = useState('12:00');
    const [endTime, setEndTime] = useState('13:00');

    // Recurrence state
    const [selectedDays, setSelectedDays] = useState<number[]>([]);

    useEffect(() => {
        if (state.selectedEvent) {
            setTitle(state.selectedEvent.title);
            setDescription(state.selectedEvent.description || '');
            setSelectedColor(state.selectedEvent.color);
            setStartTime(format(new Date(state.selectedEvent.start), 'HH:mm'));
            setEndTime(format(new Date(state.selectedEvent.end), 'HH:mm'));
            setSelectedDays(state.selectedEvent.recurrence || []);
        } else if (state.selectedDate) {
            setTitle('');
            setDescription('');
            setSelectedColor(colors[0]);
            setStartTime(format(new Date(state.selectedDate), 'HH:mm'));
            setEndTime(format(new Date(state.selectedDate + 3600000), 'HH:mm')); // +1 hour
            // Pre-select the day of the selected date if creating new
            setSelectedDays([getDay(new Date(state.selectedDate))]);
        }
    }, [state.selectedEvent, state.selectedDate]);

    const toggleDay = (dayValue: number) => {
        if (selectedDays.includes(dayValue)) {
            setSelectedDays(selectedDays.filter(d => d !== dayValue));
        } else {
            setSelectedDays([...selectedDays, dayValue]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        let startTimestamp = state.selectedDate || Date.now();

        // Parse time inputs
        const [startH, startM] = startTime.split(':').map(Number);
        const [endH, endM] = endTime.split(':').map(Number);

        // Apply time to the base date (selected date)
        const baseDate = new Date(startTimestamp);
        const startDateObj = setMinutes(setHours(baseDate, startH), startM);
        const endDateObj = setMinutes(setHours(baseDate, endH), endM);

        const event: CalendarEvent = {
            title,
            description,
            color: selectedColor,
            start: startDateObj.getTime(),
            end: endDateObj.getTime(),
            id: state.selectedEvent ? state.selectedEvent.id : Date.now().toString(),
            recurrence: selectedDays.length > 0 ? selectedDays : undefined
        };

        if (state.selectedEvent) {
            dispatch({ type: 'UPDATE_EVENT', payload: event });
        } else {
            dispatch({ type: 'ADD_EVENT', payload: event });
        }
        dispatch({ type: 'TOGGLE_EVENT_MODAL', payload: false });
    };

    const closeModal = () => {
        dispatch({ type: 'TOGGLE_EVENT_MODAL', payload: false });
        dispatch({ type: 'SET_SELECTED_EVENT', payload: null });
    };

    if (!state.showEventModal) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-700">
                <header className="bg-gray-900/50 px-5 py-4 flex justify-between items-center border-b border-gray-700">
                    <span className="text-gray-200 font-medium">
                        {state.selectedEvent ? 'Editar Actividad' : 'Añadir Actividad'}
                    </span>
                    <button type="button" onClick={closeModal} className="text-gray-400 hover:text-white hover:bg-gray-700 rounded-full p-1 transition-colors">
                        <X size={20} />
                    </button>
                </header>

                <div className="p-6 grid gap-6">
                    <div className="grid gap-1">
                        <textarea
                            name="title"
                            placeholder="Título de la actividad"
                            value={title}
                            required
                            autoFocus
                            rows={2}
                            className="w-full bg-transparent border-0 border-b-2 border-gray-600 focus:border-blue-500 focus:outline-none text-xl pt-2 pb-2 text-white placeholder-gray-500 resize-none"
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="bg-gray-700/30 p-4 rounded-lg flex flex-col gap-3">
                        <div className="flex gap-4 items-center">
                            <Clock className="text-gray-400" size={18} />
                            <div className="flex gap-2 items-center text-gray-200">
                                <input
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="bg-gray-800 border border-gray-600 rounded px-2 py-1 focus:border-blue-500 outline-none"
                                />
                                <span>-</span>
                                <input
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className="bg-gray-800 border border-gray-600 rounded px-2 py-1 focus:border-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 items-start pt-2 border-t border-gray-700/50">
                            <CalendarDays className="text-gray-400 mt-1" size={18} />
                            <div className="flex flex-wrap gap-2">
                                {dayLabels.map((day) => (
                                    <button
                                        key={day.value}
                                        type="button"
                                        onClick={() => toggleDay(day.value)}
                                        className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${selectedDays.includes(day.value)
                                            ? 'bg-blue-600 text-white shadow-lg scale-105'
                                            : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                                            }`}
                                    >
                                        {day.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 items-start">
                        <AlignLeft className="text-gray-400 mt-1" size={18} />
                        <textarea
                            name="description"
                            placeholder="Descripción (opcional)"
                            value={description}
                            className="w-full border-0 bg-gray-700/50 rounded-lg p-3 text-gray-200 focus:ring-1 focus:ring-blue-500 placeholder-gray-500 resize-none"
                            rows={2}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-3 justify-center py-2">
                        {colors.map((color) => (
                            <span
                                key={color}
                                onClick={() => setSelectedColor(color)}
                                className={`w-8 h-8 rounded-full cursor-pointer flex items-center justify-center event-${color} ring-2 ring-transparent transition-all hover:scale-110 ${selectedColor === color ? 'ring-white/50 scale-110' : ''}`}
                            >
                                {selectedColor === color && <Check size={14} className="text-white drop-shadow-md" />}
                            </span>
                        ))}
                    </div>
                </div>

                <footer className="flex justify-end border-t border-gray-700 p-4 gap-3">
                    {state.selectedEvent && (
                        <button
                            type="button"
                            onClick={() => {
                                dispatch({ type: 'DELETE_EVENT', payload: state.selectedEvent!.id });
                                dispatch({ type: 'TOGGLE_EVENT_MODAL', payload: false });
                            }}
                            className="px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors font-medium text-sm"
                        >
                            Borrar
                        </button>
                    )}
                    <button
                        type="submit"
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-lg shadow-blue-900/20 font-medium transition-colors"
                    >
                        Guardar
                    </button>
                </footer>
            </form>
        </div>
    );
};
