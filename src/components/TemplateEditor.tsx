import React, { useRef } from 'react';
import { LayoutTemplate, Upload } from 'lucide-react';

interface Props {
  template: string;
  onChange: (val: string) => void;
}

export function TemplateEditor({ template, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        onChange(event.target.result as string);
      }
    };
    reader.readAsText(file);
    // Reset input so the same file can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="bg-white dark:bg-slate-900 h-full flex flex-col overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutTemplate size={20} className="text-emerald-600 dark:text-emerald-400" />
          <h3 className="font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest">TEMPLATE (OPTIONAL)</h3>
        </div>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="p-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
          title="UPLOAD FORMATTER TEMPLATE"
        >
          <Upload size={16} />
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          accept=".txt,.md,.json,.csv,.xml,.html" 
          className="hidden" 
        />
      </div>
      <div className="flex-1 p-4">
        <textarea
          value={template}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste or type a template here. For example:&#10;&#10;Name: [blank]&#10;Date: [blank]&#10;Notes:&#10;[blank]"
          className="w-full h-full min-h-[200px] p-4 bg-slate-50 dark:bg-slate-900 border-none rounded-lg resize-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200 font-mono text-sm leading-relaxed placeholder:text-slate-400"
        />
      </div>
    </div>
  );
}
