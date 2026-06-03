'use client';

import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { useState } from 'react';

interface CalendarSidebarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function CalendarSidebar({ selectedDate, onDateChange }: CalendarSidebarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  return (
    <div className="w-full max-w-[280px] bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <CalendarIcon size={16} className="text-blue-500" />
          Historial
        </h2>
      </div>

      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-sm font-semibold text-slate-700 capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </span>
        <button 
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map(d => (
          <span key={d} className="text-[10px] font-bold text-slate-400">{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {/* Padding for first day of month */}
        {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        
        {days.map(day => {
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          
          return (
            <button
              key={day.toISOString()}
              onClick={() => onDateChange(day)}
              className={`
                aspect-square flex items-center justify-center text-sm rounded-lg transition-all
                ${isSelected ? 'bg-blue-500 text-white font-bold shadow-md shadow-blue-200' : 'hover:bg-blue-50 text-slate-600'}
                ${isToday && !isSelected ? 'border border-blue-200 text-blue-600 font-semibold' : ''}
              `}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>

      <div className="mt-4 pt-6 border-t border-slate-100">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="w-2 h-2 rounded-full bg-blue-500" /> Seleccionado
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="w-2 h-2 rounded-full border border-blue-200" /> Hoy
          </div>
        </div>
      </div>
    </div>
  );
}
