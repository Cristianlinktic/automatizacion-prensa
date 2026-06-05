'use client';

import { useState, useMemo } from 'react';
import { AnalysisResult } from '@/lib/tone-parser';
import { ExternalLink, CheckCircle, XCircle, AlertCircle, Trash2, Globe, MapPin, Newspaper } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ResultsTableProps {
  data: AnalysisResult[];
  onDelete?: (id: string) => void;
  isAdmin?: boolean;
}

export function ResultsTable({ data, onDelete, isAdmin = false }: ResultsTableProps) {
  const [selectedRegion, setSelectedRegion] = useState('Todas');
  const [selectedTone, setSelectedTone] = useState('Todos');
  
  const regions = useMemo(() => {
    const uniqueRegions = Array.from(new Set(data.filter(d => d.region).map(d => d.region)));
    return uniqueRegions.sort();
  }, [data]);

  const tones = useMemo(() => {
    const uniqueTones = Array.from(new Set(data.filter(d => d.tone).map(d => d.tone)));
    return uniqueTones.sort();
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter(d => {
      const regionMatch = selectedRegion === 'Todas' || d.region === selectedRegion;
      const toneMatch = selectedTone === 'Todos' || d.tone === selectedTone;
      return regionMatch && toneMatch;
    });
  }, [data, selectedRegion, selectedTone]);

  const handleDelete = async (id: string | undefined) => {
    if (!id) return;
    if (!confirm('¿Estás seguro de eliminar este registro?')) return;

    try {
      const { error } = await supabase
        .from('analyses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      if (onDelete) onDelete(id);
    } catch (error) {
      console.error('Error deleting record:', error);
      alert('Error al eliminar');
    }
  };

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-12 text-center">
        <p className="text-slate-500 font-medium">No hay datos para esta fecha. Sube un archivo para comenzar.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden w-full">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse table-auto">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200">
              <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Contenido</th>
              <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Detalles</th>
              <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">
                <select 
                    value={selectedRegion} 
                    onChange={(e) => setSelectedRegion(e.target.value)} 
                    className="bg-transparent text-xs font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-slate-600 focus:outline-none"
                >
                  <option value="Todas">REGION</option>
                  {regions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </th>
              <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">
                <select 
                    value={selectedTone} 
                    onChange={(e) => setSelectedTone(e.target.value)} 
                    className="bg-transparent text-xs font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-slate-600 focus:outline-none"
                >
                  <option value="Todos">TONO</option>
                  {tones.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </th>
              <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredData.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-6 min-w-[300px]">
                  <div className="flex flex-col gap-2">
                    <span className="font-bold text-slate-800 text-base leading-tight">{item.title}</span>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {item.summary}
                    </p>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold text-blue-500 hover:text-blue-700 flex items-center gap-1 mt-1 uppercase tracking-wider"
                    >
                      Ver Fuente <ExternalLink size={10} />
                    </a>
                  </div>
                </td>
                <td className="px-6 py-6">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                      <Newspaper size={14} className="text-slate-400" />
                      {item.media}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md">
                        <Globe size={12} /> {item.type}
                      </span>
                      {item.tier && (
                        <span className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                          item.tier.toString().includes('1') ? 'bg-green-100 text-green-700 border border-green-200' :
                          item.tier.toString().includes('2') ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                          item.tier.toString().includes('3') ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                          'bg-slate-50 text-slate-400 border border-slate-100'
                        }`}>
                          {item.tier}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-6">
                  <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md w-fit">
                    <MapPin size={12} /> {item.region}
                  </span>
                </td>
                <td className="px-6 py-6">
                  <div className={`
                    inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest
                    ${item.tone === 'Positivo' ? 'bg-green-100 text-green-700' : ''}
                    ${item.tone === 'Negativo' ? 'bg-red-100 text-red-700' : ''}
                    ${item.tone === 'Neutro' ? 'bg-blue-100 text-blue-700' : ''}
                    ${item.tone === 'No especificado' ? 'bg-slate-100 text-slate-600' : ''}
                  `}>
                    <span className="text-lg leading-none">{item.emoji}</span>
                    {item.tone}
                  </div>
                </td>
                <td className="px-6 py-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {isAdmin && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                    <div className="flex items-center">
                      {item.status === 'success' && <CheckCircle className="text-green-500" size={20} />}
                      {item.status === 'no_tone' && <AlertCircle className="text-amber-500" size={20} />}
                      {item.status === 'error' && <XCircle className="text-red-500" size={20} />}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
