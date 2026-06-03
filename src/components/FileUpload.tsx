'use client';

import { useState } from 'react';
import { Upload, FileText, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';

interface FileUploadProps {
  onAnalysisComplete: () => void;
}

export function FileUpload({ onAnalysisComplete }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setProgress('Leyendo archivo...');

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        // Try to find a column named 'URL' or similar
        const urls = data
          .map(row => {
            const urlKey = Object.keys(row).find(k => k.toUpperCase() === 'URL');
            return urlKey ? row[urlKey] : null;
          })
          .filter(url => url && typeof url === 'string' && url.startsWith('http'));

        if (urls.length === 0) {
          alert('No se encontraron URLs en la columna "URL".');
          setIsUploading(false);
          return;
        }

        setProgress(`Analizando ${urls.length} URLs...`);
        
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urls })
        });

        if (!response.ok) throw new Error('Error en el servidor');

        setProgress('¡Completado!');
        setTimeout(() => {
          setIsUploading(false);
          setProgress(null);
          onAnalysisComplete();
        }, 1500);

      } catch (error) {
        console.error(error);
        alert('Error procesando el archivo.');
        setIsUploading(false);
        setProgress(null);
      }
    };

    reader.readAsBinaryString(file);
    // Clear the input so the same file can be uploaded again
    e.target.value = '';
  };

  return (
    <div className="relative">
      <label className={`
        flex flex-col items-center justify-center w-full h-32 
        border-2 border-dashed rounded-xl cursor-pointer
        transition-all duration-200
        ${isUploading ? 'bg-slate-50 border-blue-200' : 'bg-white border-slate-300 hover:border-blue-400 hover:bg-blue-50/30'}
      `}>
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          {isUploading ? (
            <>
              <Loader2 className="w-8 h-8 mb-3 text-blue-500 animate-spin" />
              <p className="text-sm font-medium text-slate-600">{progress}</p>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 mb-3 text-slate-400" />
              <p className="mb-1 text-sm text-slate-600 font-medium">Haz clic para subir Excel/CSV</p>
              <p className="text-xs text-slate-400">Archivos .xlsx, .xls o .csv con columna "URL"</p>
            </>
          )}
        </div>
        <input 
          type="file" 
          className="hidden" 
          accept=".xlsx, .xls, .csv" 
          onChange={handleFileChange}
          disabled={isUploading}
        />
      </label>
    </div>
  );
}
