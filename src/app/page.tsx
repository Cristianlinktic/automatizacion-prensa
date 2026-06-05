'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarSidebar } from '@/components/CalendarSidebar';
import { FileUpload } from '@/components/FileUpload';
import { ResultsTable } from '@/components/ResultsTable';
import { AnalysisResult } from '@/lib/tone-parser';
import { LayoutDashboard, PieChart, TrendingUp, Users, BookOpen, LogOut, MapPin } from 'lucide-react';

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [data, setData] = useState<AnalysisResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const sessionStr = localStorage.getItem('session_user');
    if (!sessionStr) {
      router.push('/login');
    } else {
      try {
        const parsed = JSON.parse(sessionStr);
        setUser(parsed);
      } catch (e) {
        localStorage.removeItem('session_user');
        router.push('/login');
      }
      setAuthLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('session_user');
    router.push('/login');
  };

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

  const handleDelete = (id: string) => {
    setData(prev => prev.filter(item => item.id !== id));
  };
  const stats = {
    total: data.length,
    positivo: data.filter(i => i.tone === 'Positivo').length,
    negativo: data.filter(i => i.tone === 'Negativo').length,
    neutro: data.filter(i => i.tone === 'Neutro').length,
    avgCosto: data.length > 0 ? data.reduce((acc, curr) => {
      console.log(`Summing cost: ${curr.costo_publicitario} from URL: ${curr.url}`);
      return acc + (Number(curr.costo_publicitario) || 0);
    }, 0) / data.length : 0,
    avgAudiencia: data.length > 0 ? data.reduce((acc, curr) => acc + (Number(curr.audiencia) || 0), 0) / data.length : 0,
    avgLecturabilidad: data.length > 0 ? data.reduce((acc, curr) => acc + (Number(curr.lecturabilidad) || 0), 0) / data.length : 0,
    tiers: data.reduce((acc, curr) => {
      if (curr.tier) {
        const t = curr.tier.toString().toUpperCase();
        acc[t] = (acc[t] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>),
    regions: data.reduce((acc, curr) => {
      const r = curr.region ? curr.region.trim() : 'Nacional';
      acc[r] = (acc[r] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };

  console.log('Final Calculated Stats:', stats);


  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center gap-6">
        <div className="w-16 h-16 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest animate-pulse">Verificando Sesión...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-50/50 p-4 md:p-8 flex flex-col items-center">
      <div className="w-full flex flex-col md:flex-row gap-8 px-4">

        {/* Sidebar */}
        <div className="flex flex-col gap-6 w-full md:w-[280px] shrink-0">
          <div className="flex items-center gap-3 px-2">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-200">
              <PieChart size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">PRENSA</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Monitoreo</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-2 shadow-sm border border-slate-200">
            <CalendarSidebar
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
            />
          </div>

          {/* User Profile Card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center font-black text-blue-600 text-sm">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">@{user?.username}</p>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full inline-block mt-1 uppercase tracking-wider ${
                  user?.role === 'admin' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {user?.role === 'admin' ? 'Administrador' : 'Lector'}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut size={14} /> Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col gap-8 min-w-0">

          {/* Header & Upload */}
          <div className="bg-white rounded-[32px] p-10 shadow-sm border border-slate-200 flex flex-col gap-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="max-w-md">
                <h2 className="text-4xl font-black text-slate-800 capitalize tracking-tight">
                  {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
                </h2>
                <p className="text-slate-400 text-base mt-2 font-medium">Análisis de impacto y métricas publicitarias</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <StatCard label="Total" value={stats.total.toLocaleString('es-ES', { maximumFractionDigits: 0 })} color="blue" />
                <StatCard label="Positivo" value={stats.positivo.toLocaleString('es-ES', { maximumFractionDigits: 0 })} color="green" />
                <StatCard label="Negativo" value={stats.negativo.toLocaleString('es-ES', { maximumFractionDigits: 0 })} color="red" />
                <StatCard label="Prom. Costo" value={stats.avgCosto.toLocaleString('es-ES', { maximumFractionDigits: 0 })} color="amber" icon={<TrendingUp size={12} />} />
                <StatCard label="Prom. Audiencia" value={stats.avgAudiencia.toLocaleString('es-ES', { maximumFractionDigits: 0 })} color="indigo" icon={<Users size={12} />} />
                <StatCard label="Lecturabilidad" value={stats.avgLecturabilidad.toLocaleString('es-ES', { maximumFractionDigits: 0 })} color="purple" icon={<BookOpen size={12} />} />
              </div>

            </div>

            {user?.role === 'admin' && (
              <div className="bg-slate-50 p-6 rounded-3xl border border-dashed border-slate-200">
                <FileUpload 
                  onAnalysisComplete={() => fetchHistory(selectedDate)} 
                  selectedDate={selectedDate}
                />
              </div>
            )}

            {Object.keys(stats.tiers).length > 0 && (
              <div className="flex flex-col gap-4 pt-6 border-t border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <TrendingUp size={12} className="text-amber-500" /> Clasificación por Importancia (Tiers)
                </span>
                <div className="flex flex-wrap gap-4">
                  {Object.entries(stats.tiers).sort().map(([tier, count]) => {
                    const isTier1 = tier.includes('1');
                    const isTier2 = tier.includes('2');
                    const isTier3 = tier.includes('3');
                    
                    let style = "bg-slate-50 text-slate-600 border-slate-200";
                    let label = "Prioridad";
                    if (isTier1) {
                        style = "bg-green-50 text-green-700 border-green-200 shadow-sm shadow-green-100";
                        label = "Alta Prioridad";
                    } else if (isTier2) {
                        style = "bg-amber-50 text-amber-700 border-amber-200 shadow-sm shadow-amber-50";
                        label = "Prioridad Media";
                    } else if (isTier3) {
                        style = "bg-blue-50 text-blue-600 border-blue-100";
                        label = "Prioridad Baja";
                    }

                    return (
                      <div key={tier} className={`flex items-center gap-4 px-5 py-3 rounded-2xl border ${style} transition-all hover:scale-105`}>
                        <div className="flex flex-col">
                            <span className="text-xs font-black uppercase tracking-wider">{tier}</span>
                            <span className="text-[9px] font-bold uppercase tracking-tight opacity-70">{label}</span>
                        </div>
                        <div className="h-8 w-[1px] bg-current opacity-20"></div>
                        <span className="text-2xl font-black">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {Object.keys(stats.regions).length > 0 && (
              <div className="flex flex-col gap-4 pt-6 border-t border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <MapPin size={12} className="text-blue-500" /> Monitoreo por Región
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {Object.entries(stats.regions).sort(([a], [b]) => a.localeCompare(b)).map(([region, count]) => (
                    <div 
                      key={region} 
                      className="bg-slate-50/60 hover:bg-white border border-slate-200/60 hover:border-blue-200 rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all duration-200 hover:scale-[1.03] hover:shadow-sm"
                    >
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate w-full text-center">
                        {region}
                      </span>
                      <span className="text-2xl font-black text-slate-800 mt-1">
                        {count}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em] mt-1">
                        {count === 1 ? 'registro' : 'registros'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Results Table */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between px-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                <LayoutDashboard size={16} /> Base de datos de análisis
              </h3>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-32 gap-6 bg-white rounded-[32px] border border-slate-200 border-dashed">
                <div className="w-16 h-16 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest animate-pulse">Sincronizando con base de datos...</p>
              </div>
            ) : (
              <ResultsTable data={data} onDelete={handleDelete} isAdmin={user?.role === 'admin'} />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value, color, icon }: { label: string, value: string | number, color: 'blue' | 'green' | 'red' | 'slate' | 'amber' | 'indigo' | 'purple', icon?: React.ReactNode }) {
  const colors = {
    blue: 'text-blue-600 bg-blue-50 border-blue-100',
    green: 'text-green-600 bg-green-50 border-green-100',
    red: 'text-red-600 bg-red-50 border-red-100',
    slate: 'text-slate-600 bg-slate-50 border-slate-200',
    amber: 'text-amber-600 bg-amber-50 border-amber-100',
    indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    purple: 'text-purple-600 bg-purple-50 border-purple-100',
  };

  return (
    <div className={`px-4 py-3 rounded-[20px] border ${colors[color]} flex flex-col items-center min-w-[100px] transition-transform hover:scale-105`}>
      <span className="text-[9px] font-black uppercase tracking-[0.15em] opacity-60 mb-0.5 whitespace-nowrap text-center flex items-center gap-1">
        {icon} {label}
      </span>
      <span className="text-xl font-black">{value}</span>
    </div>
  );
}
