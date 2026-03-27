import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileImage, X, Maximize2, Loader2 } from 'lucide-react';

interface Props {
  files: File[];
  fileStatuses?: ('pending' | 'processing' | 'success' | 'error')[];
  onFilesAdded: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  onClearFiles: () => void;
}

export function UploadDropzone({ files, fileStatuses = [], onFilesAdded, onRemoveFile, onClearFiles }: Props) {
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFilesAdded(acceptedFiles);
  }, [onFilesAdded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/bmp': ['.bmp']
    }
  });

  return (
    <div className="flex flex-col flex-1">
      <div 
        {...getRootProps()} 
        className={`p-4 sm:p-6 text-center cursor-pointer transition-colors duration-200 ease-in-out border-b border-slate-200 dark:border-slate-800
          ${isDragActive ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 border-b-2' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 bg-white dark:bg-slate-900'}`}
      >
        <input {...getInputProps()} />
        <UploadCloud className="mx-auto h-12 w-12 text-slate-400 mb-4" />
        <p className="text-lg font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest">
          {isDragActive ? "DROP IMAGES HERE..." : "DROP IMAGE HERE"}
        </p>
        <p className="text-sm text-slate-400 dark:text-slate-500/70 mt-2 font-mono tracking-wide">
          SUPPORTS JPG, PNG, WEBP, BMP
        </p>
      </div>

      {files.length > 0 && (
        <div className="p-3 bg-white dark:bg-slate-900 flex-1 overflow-y-auto">
          <h4 className="font-bold text-[11px] text-slate-500 dark:text-slate-500 mb-2 flex items-center justify-between uppercase tracking-widest">
            SELECTED IMAGES ({files.length})
            <button 
              onClick={onClearFiles}
              className="px-2 py-1 bg-slate-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-[10px] text-slate-500 hover:text-red-600 transition-colors border border-slate-200 dark:border-slate-700 font-black"
            >
              CLEAR ALL
            </button>
          </h4>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {files.map((file, i) => {
              const status = fileStatuses[i] || 'pending';
              
              let borderColors = 'border-slate-200 dark:border-slate-700';
              if (status === 'pending') borderColors = 'border-red-400 dark:border-red-500 border-2';
              if (status === 'processing') borderColors = 'border-blue-400 dark:border-blue-500 border-2';
              if (status === 'success') borderColors = 'border-emerald-400 dark:border-emerald-500 border-2';
              if (status === 'error') borderColors = 'border-red-600 dark:border-red-600 border-2';

              return (
              <div key={i} className={`relative group overflow-hidden transition-all duration-300 aspect-square bg-slate-100 dark:bg-slate-800 flex items-center justify-center cursor-zoom-in ${borderColors}`} onClick={() => setZoomedImage(URL.createObjectURL(file))}>
                <img 
                  src={URL.createObjectURL(file)} 
                  alt={file.name} 
                  className={`w-full h-full object-cover transition-all ${status === 'processing' ? 'opacity-50 blur-[2px]' : 'group-hover:opacity-70'}`}
                />
                
                {status === 'processing' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <Loader2 size={32} className="text-blue-500 animate-spin drop-shadow-md" />
                  </div>
                )}
                
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {status !== 'processing' && <Maximize2 size={24} className="text-white drop-shadow-lg" />}
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); onRemoveFile(i); }}
                  className="absolute top-1 right-1 bg-black/60 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={14} />
                </button>
              </div>
              );
            })}
          </div>
        </div>
      )}

      {zoomedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200" 
          onClick={() => setZoomedImage(null)}
        >
          <button 
            className="absolute top-6 right-6 text-white hover:text-emerald-400 bg-slate-900/50 p-2 rounded-full transition-colors"
            onClick={() => setZoomedImage(null)}
            title="Minimize"
          >
            <X size={28} />
          </button>
          <div className="max-w-screen-2xl max-h-[90vh] overflow-auto rounded-lg shadow-2xl custom-scrollbar" onClick={e => e.stopPropagation()}>
            <img 
              src={zoomedImage} 
              className="w-auto h-auto min-w-[300px] max-w-full block object-contain select-none bg-white/5" 
              alt="Zoomed document preview" 
            />
          </div>
        </div>
      )}
    </div>
  );
}
