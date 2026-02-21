import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

export interface CalendarEvent {
    id: string;
    title: string;
    start: number; // timestamp
    end: number;   // timestamp
    color: string;
    description?: string;
    recurrence?: number[]; // 0 for Sunday, 1 for Monday, etc.
}

interface CalendarState {
    monthIndex: number; // 0-11
    year: number;
    selectedDate: number | null; // timestamp of selected day
    showEventModal: boolean;
    savedEvents: CalendarEvent[];
    selectedEvent: CalendarEvent | null;
}

type Action =
    | { type: 'SET_MONTH_INDEX'; payload: number }
    | { type: 'SET_YEAR'; payload: number }
    | { type: 'SET_SELECTED_DATE'; payload: number }
    | { type: 'TOGGLE_EVENT_MODAL'; payload: boolean }
    | { type: 'ADD_EVENT'; payload: CalendarEvent }
    | { type: 'UPDATE_EVENT'; payload: CalendarEvent }
    | { type: 'DELETE_EVENT'; payload: string }
    | { type: 'CLEAR_EVENTS' }
    | { type: 'SET_SELECTED_EVENT'; payload: CalendarEvent | null };

const initialState: CalendarState = {
    monthIndex: new Date().getMonth(),
    year: new Date().getFullYear(),
    selectedDate: null,
    showEventModal: false,
    savedEvents: [],
    selectedEvent: null,
};

function calendarReducer(state: CalendarState, action: Action): CalendarState {
    switch (action.type) {
        case 'SET_MONTH_INDEX':
            return { ...state, monthIndex: action.payload };
        case 'SET_YEAR':
            return { ...state, year: action.payload };
        case 'SET_SELECTED_DATE':
            return { ...state, selectedDate: action.payload };
        case 'TOGGLE_EVENT_MODAL':
            return { ...state, showEventModal: action.payload };
        case 'ADD_EVENT':
            return { ...state, savedEvents: [...state.savedEvents, action.payload] };
        case 'UPDATE_EVENT':
            return {
                ...state,
                savedEvents: state.savedEvents.map((evt) =>
                    evt.id === action.payload.id ? action.payload : evt
                ),
            };
        case 'DELETE_EVENT':
            return {
                ...state,
                savedEvents: state.savedEvents.filter((evt) => evt.id !== action.payload),
            };
        case 'CLEAR_EVENTS':
            return {
                ...state,
                savedEvents: [],
            };
        case 'SET_SELECTED_EVENT':
            return { ...state, selectedEvent: action.payload };
        default:
            return state;
    }
}

const CalendarContext = createContext<{
    state: CalendarState;
    dispatch: React.Dispatch<Action>;
} | null>(null);

export const CalendarProvider = ({ children }: { children: ReactNode }) => {
    const [state, dispatch] = useReducer(calendarReducer, initialState, (initial) => {
        const storageEvents = localStorage.getItem('savedEvents');
        return {
            ...initial,
            savedEvents: storageEvents ? JSON.parse(storageEvents) : [],
        };
    });

    useEffect(() => {
        localStorage.setItem('savedEvents', JSON.stringify(state.savedEvents));
    }, [state.savedEvents]);

    return (
        <CalendarContext.Provider value={{ state, dispatch }}>
            {children}
        </CalendarContext.Provider>
    );
};

export const useCalendar = () => {
    const context = useContext(CalendarContext);
    if (!context) {
        throw new Error('useCalendar must be used within a CalendarProvider');
    }
    return context;
};
