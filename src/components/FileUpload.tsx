'use client';

import { useState } from 'react';
import { Upload, FileText, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';

interface FileUploadProps {
  onAnalysisComplete: () => void;
  selectedDate: Date;
}

export function FileUpload({ onAnalysisComplete, selectedDate }: FileUploadProps) {
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

        // Try to find columns named 'URL', 'tipo', 'medio', 'resumen' or similar
        const rowsToProcess = data
          .map(row => {
            // Normalize by removing ALL whitespace, newlines, and accents
            const normalize = (s: string) => s.toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .replace(/\s+/g, "") // Remove all spaces and newlines
              .trim();

            const findKey = (name: string) => Object.keys(row).find(k => {
              const normalizedK = normalize(k);
              const normalizedName = normalize(name);
              return normalizedK === normalizedName || normalizedK.includes(normalizedName);
            });
            
            if (data.indexOf(row) === 0) {
              console.log('Available Excel columns (Raw):', Object.keys(row));
              console.log('Available Excel columns (Normalized):', Object.keys(row).map(normalize));
            }

            const urlKey = findKey('URL');
            const typeKey = findKey('tipo');
            const mediaKey = findKey('medio');
            const summaryKey = findKey('resumen');
            const regionKey = findKey('region');
            const tierKey = findKey('tier');
            // Try different possible names for cost
            const costKey = findKey('costopublicitario') || findKey('costo');
            const audienceKey = findKey('audiencia');
            const readabilityKey = findKey('lecturabilidad');

            const rawCost = costKey ? row[costKey] : 0;
            
            // Clean number specifically for formats like 3700053,5 or $ 3.700.053,5
            const cleanNumber = (val: any) => {
              if (val === undefined || val === null || val === '') return 0;
              if (typeof val === 'number') return val;
              if (typeof val === 'string') {
                // Remove everything except digits and the LAST comma or dot
                // In your case 3700053,5 -> the comma is the decimal
                let cleaned = val.replace(/[^0-9.,]/g, '');
                
                // If it has both . and , (like 3.700.053,5)
                if (cleaned.includes('.') && cleaned.includes(',')) {
                  cleaned = cleaned.replace(/\./g, '').replace(',', '.');
                } else if (cleaned.includes(',')) {
                  // If it only has comma (3700053,5)
                  cleaned = cleaned.replace(',', '.');
                }
                
                const result = parseFloat(cleaned);
                return isNaN(result) ? 0 : result;
              }
              return 0;
            };

            const item = {
              url: urlKey ? row[urlKey] : null,
              tipo: typeKey ? row[typeKey] : null,
              medio: mediaKey ? row[mediaKey] : null,
              resumen: summaryKey ? row[summaryKey] : null,
              region: regionKey ? row[regionKey] : null,
              tier: tierKey ? row[tierKey] : null,
              costo: cleanNumber(rawCost),
              audiencia: cleanNumber(audienceKey ? row[audienceKey] : 0),
              lecturabilidad: cleanNumber(readabilityKey ? row[readabilityKey] : 0),
            };
            
            return item;
          })
          .filter(item => item.url && typeof item.url === 'string' && item.url.startsWith('http'));

        console.log('Parsed Excel rows example:', rowsToProcess[0]);

        if (rowsToProcess.length === 0) {
          alert('No se encontraron URLs válidas en la columna "URL".');
          setIsUploading(false);
          return;
        }

        setProgress(`Analizando ${rowsToProcess.length} registros...`);
        
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            data: rowsToProcess,
            date: selectedDate.toISOString()
          })
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
