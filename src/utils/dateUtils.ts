import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format } from 'date-fns';
import { es } from 'date-fns/locale';

export const getMonthMatrix = (year: number, month: number) => {
    const firstDay = startOfMonth(new Date(year, month));
    const lastDay = endOfMonth(new Date(year, month));

    const startDate = startOfWeek(firstDay, { weekStartsOn: 1 }); // Monday start
    const endDate = endOfWeek(lastDay, { weekStartsOn: 1 });

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    return days;
};

export const getWeekDays = (date: Date) => {
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const end = endOfWeek(date, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
};

export const getMonthName = (monthIndex: number) => {
    return format(new Date(new Date().getFullYear(), monthIndex), 'MMMM', { locale: es }).replace(/^\w/, (c) => c.toUpperCase());
};
