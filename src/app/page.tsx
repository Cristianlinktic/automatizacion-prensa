'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarSidebar } from '@/components/CalendarSidebar';
import { FileUpload } from '@/components/FileUpload';
import { ResultsTable } from '@/components/ResultsTable';
import { AnalysisResult } from '@/lib/tone-parser';
import { LayoutDashboard, PieChart, Info } from 'lucide-react';

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [data, setData] = useState<AnalysisResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = useCallback(async (date: Date) => {
    setIsLoading(true);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const res = await fetch(`/api/history?date=${dateStr}`);
      const json = await res.json();
      setData(json.data || []);
    } catch (error) {
      console.error("Error fetching history", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory(selectedDate);
  }, [selectedDate, fetchHistory]);

  const stats = {
    total: data.length,
    positivo: data.filter(i => i.tone === 'Positivo').length,
    negativo: data.filter(i => i.tone === 'Negativo').length,
    neutro: data.filter(i => i.tone === 'Neutro').length,
  };

  return (
    <main className="min-h-screen p-4 md:p-8 flex flex-col items-center">
      <div className="max-w-6xl w-full flex flex-col md:flex-row gap-8">
        
        {/* Sidebar */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <PieChart size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight">IP ANALYZER</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monitor de Tono v2.0</p>
            </div>
          </div>
          
          <CalendarSidebar 
            selectedDate={selectedDate} 
            onDateChange={setSelectedDate} 
          />
          
          <div className="bg-slate-800 rounded-2xl p-6 text-white shadow-xl">
            <h3 className="text-sm font-bold opacity-60 uppercase mb-4 tracking-wider flex items-center gap-2">
              <Info size={14} /> Tips
            </h3>
            <p className="text-xs leading-relaxed opacity-90">
              Sube archivos .xlsx o .csv con una columna llamada "URL". Los resultados se acumularán automáticamente por día.
            </p>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col gap-8">
          
          {/* Header & Upload */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-800 capitalize">
                  {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
                </h2>
                <p className="text-slate-400 text-sm">Resumen de monitoreo y análisis de medios</p>
              </div>
              <div className="flex gap-4">
                <StatCard label="Total" value={stats.total} color="blue" />
                <StatCard label="Pos" value={stats.positivo} color="green" />
                <StatCard label="Neg" value={stats.negativo} color="red" />
              </div>
            </div>

            <FileUpload onAnalysisComplete={() => fetchHistory(selectedDate)} />
          </div>

          {/* Results Table */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <LayoutDashboard size={14} /> Resultados del día
              </h3>
              {data.length > 0 && (
                <span className="text-xs font-bold text-blue-500 bg-blue-50 px-3 py-1 rounded-full">
                  {data.length} registros acumulados
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                <p className="text-sm font-bold text-slate-400 animate-pulse">Cargando datos...</p>
              </div>
            ) : (
              <ResultsTable data={data} />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value, color }: { label: string, value: number, color: 'blue' | 'green' | 'red' }) {
  const colors = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    red: 'text-red-600 bg-red-50',
  };
  
  return (
    <div className={`px-4 py-2 rounded-2xl ${colors[color]} flex flex-col items-center min-w-[70px]`}>
      <span className="text-[10px] font-black uppercase tracking-widest opacity-70">{label}</span>
      <span className="text-xl font-black">{value}</span>
    </div>
  );
}
