import React, { useState, useRef } from 'react';
import { useCalendar, CalendarEvent } from '../context/CalendarContext';
import { getWeekDays } from '../utils/dateUtils';
import { format, isSameDay, addDays, subDays, startOfWeek, getHours, getMinutes, setHours, startOfDay, getDay, setMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, FileJson, X, Copy, Trash2 } from 'lucide-react';

export const WeeklyView: React.FC = () => {
    const { state, dispatch } = useCalendar();
    const containerRef = useRef<HTMLDivElement>(null);
    const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
    const [showImportModal, setShowImportModal] = useState(false);
    const [jsonInput, setJsonInput] = useState('');

    const weekDays = getWeekDays(currentWeekStart);

    // Determine start/end hours
    const startHour = 1;
    const endHour = 23;
    const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);

    const handlePrevWeek = () => setCurrentWeekStart(subDays(currentWeekStart, 7));
    const handleNextWeek = () => setCurrentWeekStart(addDays(currentWeekStart, 7));
    const handleToday = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

    const handleTimeSlotClick = (day: Date, hour: number) => {
        const dateWithTime = setHours(startOfDay(day), hour);
        dispatch({ type: 'SET_SELECTED_DATE', payload: dateWithTime.getTime() });
        dispatch({ type: 'TOGGLE_EVENT_MODAL', payload: true });
        dispatch({ type: 'SET_SELECTED_EVENT', payload: null });
    };

    const handleCopyPrompt = async () => {
        const promptText = `Por favor, extrae los horarios y devuelve SOLAMENTE el siguiente formato JSON, sin texto adicional. IMPORTANTE: OMITE cualquier curso o actividad que no tenga días o un horario específico asignado.

[
  {
    "title": "Nombre de la Actividad",
    "description": "Detalles adicionales (opcional)",
    "startTime": "08:00",
    "endTime": "10:00",
    "days": [1, 3], // 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado, 0=Domingo
    "color": "blue" // Opciones: blue, green, purple, red, yellow
  }
]`;
        try {
            await navigator.clipboard.writeText(promptText);
            alert("Prompt JSON copiado al portapapeles. Pégalo en ChatGPT/Claude junto a tu horario.");
        } catch (err) {
            console.error("Error copying to clipboard:", err);
            alert("Error al copiar el prompt.");
        }
    };

    const handleImportJson = () => {
        try {
            const data = JSON.parse(jsonInput);
            const dayMap: { [key: string]: number } = {
                'Lunes': 0, 'Martes': 1, 'Miércoles': 2, 'Jueves': 3, 'Viernes': 4, 'Sábado': 5, 'Domingo': 6
            };
            const colors = ['blue', 'green', 'purple', 'red', 'yellow'];
            let eventsAdded = 0;

            // Strategy 0: Check for Top-Level Array (New Format)
            if (Array.isArray(data)) {
                data.forEach((item: any) => {
                    // Check if it matches the expected structure
                    if (item.title && item.startTime && item.endTime) {
                        const [startH, startM] = item.startTime.split(':').map(Number);
                        const [endH, endM] = item.endTime.split(':').map(Number);

                        let days: number[] = [];
                        if (Array.isArray(item.days)) {
                            // Normalize days (handle 7 as 0 for Sunday)
                            days = item.days.map((d: any) => Number(d) % 7);
                        }

                        // Determine the base date for the event
                        // If recurrence exists, use the first recurring day to anchor the event
                        // This prevents the event from appearing on "Today" if today is not in the recurrence list
                        let baseDate = new Date();
                        if (days.length > 0) {
                            // Find the day in the current week that matches the first recurrence day
                            const targetDay = weekDays.find(d => getDay(d) === days[0]);
                            if (targetDay) {
                                baseDate = targetDay;
                            }
                        }

                        const start = setMinutes(setHours(baseDate, startH), startM);
                        const end = setMinutes(setHours(baseDate, endH), endM);

                        const newEvent: CalendarEvent = {
                            id: Date.now().toString() + Math.random().toString(),
                            title: item.title,
                            description: item.description || '',
                            start: start.getTime(),
                            end: end.getTime(),
                            color: item.color || colors[Math.floor(Math.random() * colors.length)],
                            recurrence: days
                        };

                        dispatch({ type: 'ADD_EVENT', payload: newEvent });
                        eventsAdded++;
                    }
                });
            }
            // Strategy 1: Check for "horario_academico" (Old format: grouped by Day)
            else if (data.horario_academico) {
                const schedule = data.horario_academico;
                Object.entries(schedule).forEach(([dayName, events]) => {
                    const dayIndex = dayMap[dayName];
                    if (dayIndex === undefined) return;
                    const targetDate = weekDays[dayIndex];

                    if (Array.isArray(events)) {
                        events.forEach((evt: any) => {
                            const [startH, startM] = evt.inicio.split(':').map(Number);
                            const [endH, endM] = evt.fin.split(':').map(Number);

                            const start = setMinutes(setHours(targetDate, startH), startM);
                            const end = setMinutes(setHours(targetDate, endH), endM);

                            const newEvent: CalendarEvent = {
                                id: Date.now().toString() + Math.random().toString(),
                                title: evt.curso,
                                description: `Aula: ${evt.seccion} - Código: ${evt.codigo}`,
                                start: start.getTime(),
                                end: end.getTime(),
                                color: colors[Math.floor(Math.random() * colors.length)],
                                recurrence: [getDay(targetDate)]
                            };

                            dispatch({ type: 'ADD_EVENT', payload: newEvent });
                            eventsAdded++;
                        });
                    }
                });
            }
            // Strategy 2: Check for "plan_estudios_..." or any object containing "cursos" (New format: list of Courses)
            else {
                const planKey = Object.keys(data).find(key => data[key] && Array.isArray(data[key].cursos));

                if (planKey) {
                    const cursos = data[planKey].cursos;

                    cursos.forEach((curso: any) => {
                        if (curso.horarios && Array.isArray(curso.horarios)) {
                            curso.horarios.forEach((horario: any) => {
                                const dayIndex = dayMap[horario.dia];
                                if (dayIndex === undefined) return;

                                const targetDate = weekDays[dayIndex];
                                const [startH, startM] = horario.inicio.split(':').map(Number);
                                const [endH, endM] = horario.fin.split(':').map(Number);

                                const start = setMinutes(setHours(targetDate, startH), startM);
                                const end = setMinutes(setHours(targetDate, endH), endM);

                                const newEvent: CalendarEvent = {
                                    id: Date.now().toString() + Math.random().toString(),
                                    title: curso.nombre,
                                    description: `Secc: ${curso.seccion} - ${curso.docente || ''}`,
                                    start: start.getTime(),
                                    end: end.getTime(),
                                    color: colors[Math.floor(Math.random() * colors.length)],
                                    recurrence: [getDay(targetDate)]
                                };

                                dispatch({ type: 'ADD_EVENT', payload: newEvent });
                                eventsAdded++;
                            });
                        }
                    });
                }
            }

            if (eventsAdded === 0) throw new Error("No se encontraron eventos válidos o el formato no es reconocido");

            setShowImportModal(false);
            setJsonInput('');
            alert(`Se han importado ${eventsAdded} actividades correctamente.`);

        } catch (error) {
            alert('Error al importar JSON. Verifica el formato.');
            console.error(error);
        }
    };

    const getEventStyle = (event: CalendarEvent) => {
        const start = new Date(event.start);
        const end = new Date(event.end);
        const startH = getHours(start);
        const startM = getMinutes(start);
        const endH = getHours(end);
        const endM = getMinutes(end);

        // Calculate top offset (minutes from startHour)
        const minutesFromStart = (startH - startHour) * 60 + startM;
        const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);

        // 60px per hour = 1px per minute
        const top = minutesFromStart;
        const height = durationMinutes;

        return {
            top: `${top}px`,
            height: `${height}px`,
            minHeight: '20px'
        };
    };

    return (
        <div ref={containerRef} className="flex flex-col h-full bg-gray-900 text-gray-200 overflow-hidden relative">
            {/* Import Modal */}
            {showImportModal && (
                <div className="absolute inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-gray-800 p-6 rounded-lg w-full max-w-2xl shadow-xl border border-gray-700 flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">Importar Horario (JSON)</h3>
                            <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>
                        <textarea
                            className="w-full h-64 bg-gray-900 border border-gray-700 rounded p-4 text-sm font-mono text-gray-300 focus:outline-none focus:border-blue-500"
                            placeholder='Pega tu JSON aquí...'
                            value={jsonInput}
                            onChange={(e) => setJsonInput(e.target.value)}
                        />
                        <div className="flex justify-between w-full">
                            <button
                                onClick={() => {
                                    if (window.confirm('¿Estás seguro de que deseas borrar TODAS las actividades? Esta acción no se puede deshacer.')) {
                                        dispatch({ type: 'CLEAR_EVENTS' });
                                        alert('Todas las actividades han sido eliminadas.');
                                    }
                                }}
                                className="px-4 py-2 rounded bg-red-900/30 text-red-400 hover:bg-red-900/50 font-medium transition-colors flex items-center gap-2 border border-red-900/50"
                            >
                                <Trash2 size={16} />
                                Borrar Todo
                            </button>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowImportModal(false)}
                                    className="px-4 py-2 rounded text-gray-300 hover:bg-gray-700"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleImportJson}
                                    className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-500 font-medium"
                                >
                                    Importar JSON
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Week Navigation Header - Simplified */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-white">
                        Horario Semanal
                    </h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCopyPrompt}
                            className="ml-4 flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-xs rounded-md transition-colors text-purple-300 border border-purple-900/30"
                            title="Copiar prompt JSON para IA"
                        >
                            <Copy size={14} />
                            Prompt IA
                        </button>
                        <button
                            onClick={() => setShowImportModal(true)}
                            className="ml-2 flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-xs rounded-md transition-colors text-blue-300 border border-blue-900/30"
                        >
                            <FileJson size={14} />
                            Importar
                        </button>
                        <button
                            onClick={() => {
                                if (window.confirm('¿Estás seguro de que deseas borrar TODAS las actividades?')) {
                                    dispatch({ type: 'CLEAR_EVENTS' });
                                }
                            }}
                            className="ml-2 flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-xs rounded-md transition-colors text-red-300 border border-red-900/30"
                            title="Borrar todo"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleToday} className="px-3 py-1 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors">
                        Actual
                    </button>
                    <button onClick={handlePrevWeek} className="p-1 hover:bg-gray-700 text-gray-400 hover:text-white rounded-full transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <button onClick={handleNextWeek} className="p-1 hover:bg-gray-700 text-gray-400 hover:text-white rounded-full transition-colors">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Scrollable Grid Area */}
            <div className="flex-1 overflow-y-auto relative bg-gray-900 custom-scrollbar">

                {/* Grid Header (Sticky) */}
                <div className="sticky top-0 z-50 flex border-b border-gray-700 bg-gray-800 shadow-md">
                    <div className="w-16 border-r border-gray-700 flex-shrink-0 bg-gray-900"></div> {/* Time col header spacer */}
                    <div className="grid grid-cols-7 flex-1 bg-gray-800">
                        {weekDays.map((day, i) => {
                            const isToday = isSameDay(day, new Date());
                            return (
                                <div key={i} className={`py-4 text-center border-r border-gray-700 ${isToday ? 'bg-blue-900/10' : ''}`}>
                                    <p className={`text-sm font-bold uppercase tracking-wider ${isToday ? 'text-blue-400' : 'text-gray-400'}`}>
                                        {format(day, 'EEEE', { locale: es })}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex w-full" style={{ height: `${(endHour - startHour + 1) * 60}px` }}> {/* Dynamic height */}

                    {/* Time Column */}
                    <div className="w-16 flex-shrink-0 border-r border-gray-700 bg-gray-900 select-none z-20 relative">
                        {hours.map((hour, index) => (
                            <React.Fragment key={hour}>
                                {/* Hour Label - Aligned with the top of the slot */}
                                <div
                                    className="absolute w-full text-right pr-2 text-xs text-gray-400 font-medium transform -translate-y-1/2"
                                    style={{ top: `${index * 60}px` }}
                                >
                                    {hour}:00
                                </div>
                            </React.Fragment>
                        ))}
                        {/* Final 00:00 Label */}
                        <div
                            className="absolute w-full text-right pr-2 text-xs text-gray-400 font-medium transform -translate-y-1/2"
                            style={{ top: `${hours.length * 60}px` }}
                        >
                            00:00
                        </div>
                    </div>

                    {/* Days Columns */}
                    <div className="flex-1 grid grid-cols-7 relative">
                        {/* Background Grid Lines */}
                        {Array.from({ length: hours.length + 1 }).map((_, i) => (
                            <div
                                key={`line-${i}`}
                                className="absolute w-full border-b border-gray-800 pointer-events-none"
                                style={{ top: `${i * 60}px` }}
                            />
                        ))}

                        {/* Columns logic */}
                        {weekDays.map((day, dayIdx) => {
                            // Filter events for this day
                            const dayEvents = state.savedEvents.filter(evt => {
                                // 1. Check if specific date matches
                                const isSpecificDate = isSameDay(new Date(evt.start), day);

                                // 2. Check if recurrence matches
                                const dayOfWeek = getDay(day); // 0-6
                                const isRecurring = evt.recurrence && evt.recurrence.includes(dayOfWeek);

                                return isSpecificDate || isRecurring;
                            });

                            // Calculate overlapping positions
                            const sortedEvents = dayEvents.sort((a, b) => {
                                const startA = getHours(new Date(a.start)) * 60 + getMinutes(new Date(a.start));
                                const startB = getHours(new Date(b.start)) * 60 + getMinutes(new Date(b.start));
                                return startA - startB;
                            });

                            return (
                                <div key={dayIdx} className="relative border-r border-gray-700 h-full">
                                    {/* Click targets for each hour */}
                                    {hours.map((hour, hourIdx) => (
                                        <div
                                            key={`slot-${dayIdx}-${hour}`}
                                            className="absolute w-full hover:bg-gray-800/30 cursor-pointer transition-colors z-0"
                                            style={{
                                                top: `${hourIdx * 60}px`,
                                                height: '60px'
                                            }}
                                            onClick={() => handleTimeSlotClick(day, hour)}
                                        />
                                    ))}

                                    {/* Events */}
                                    {sortedEvents.map((evt, idx) => {
                                        const style = getEventStyle(evt);
                                        const standardColors = ['blue', 'green', 'purple', 'red', 'yellow'];
                                        const isStandardColor = standardColors.includes(evt.color);

                                        return (
                                            <div
                                                key={`${evt.id}-${dayIdx}`} // Unique key for recurring instances
                                                style={{
                                                    ...style,
                                                    ...(!isStandardColor ? { backgroundColor: evt.color } : {}),
                                                    zIndex: 10 + idx,
                                                    width: '90%', // Leave room to see overlaps
                                                    left: '5%'
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    dispatch({ type: 'SET_SELECTED_EVENT', payload: evt });
                                                    const evtStart = new Date(evt.start);
                                                    const currentDayStart = setHours(setMinutes(day, getMinutes(evtStart)), getHours(evtStart));

                                                    dispatch({ type: 'SET_SELECTED_DATE', payload: currentDayStart.getTime() });
                                                    dispatch({ type: 'TOGGLE_EVENT_MODAL', payload: true });
                                                }}
                                                className={`absolute rounded px-2 py-1 text-xs font-medium text-white overflow-hidden cursor-pointer shadow-md hover:brightness-110 ${isStandardColor ? `event-${evt.color}` : ''} border-l-4 border-black/20 bg-opacity-90 hover:z-50 hover:w-full hover:left-0 transition-all`}
                                            >
                                                <div className="font-bold truncate">{evt.title}</div>
                                                <div className="opacity-90 text-[10px] truncate">
                                                    {format(new Date(evt.start), 'HH:mm')} - {format(new Date(evt.end), 'HH:mm')}
                                                </div>
                                                {evt.description && (
                                                    <div className="opacity-80 text-[10px] truncate mt-0.5 block">
                                                        {evt.description}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
