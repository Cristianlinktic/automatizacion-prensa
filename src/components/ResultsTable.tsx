'use client';

import { AnalysisResult } from '@/lib/tone-parser';
import { ExternalLink, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface ResultsTableProps {
  data: AnalysisResult[];
}

export function ResultsTable({ data }: ResultsTableProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
        <p className="text-slate-500">No hay datos para esta fecha. Sube un archivo para comenzar.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-bottom border-slate-200">
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Título / URL</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Tono</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((item, index) => (
              <tr key={index} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-slate-800 line-clamp-1">{item.title}</span>
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                    >
                      {item.url.substring(0, 60)}...
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className={`
                    inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold
                    ${item.tone === 'Positivo' ? 'bg-green-100 text-green-700' : ''}
                    ${item.tone === 'Negativo' ? 'bg-red-100 text-red-700' : ''}
                    ${item.tone === 'Neutro' ? 'bg-blue-100 text-blue-700' : ''}
                    ${item.tone === 'No especificado' ? 'bg-slate-100 text-slate-600' : ''}
                  `}>
                    <span className="text-lg">{item.emoji}</span>
                    {item.tone}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {item.status === 'success' && <CheckCircle className="text-green-500" size={20} />}
                  {item.status === 'no_tone' && <AlertCircle className="text-amber-500" size={20} />}
                  {item.status === 'error' && <XCircle className="text-red-500" size={20} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
