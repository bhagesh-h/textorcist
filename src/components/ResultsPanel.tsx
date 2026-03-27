import React, { useState } from 'react';
import { Copy, Download, Check, AlertTriangle, Trash2, X } from 'lucide-react';
import type { OcrResult } from '../lib/types';

interface Props {
  result: OcrResult | null;
  isProcessing: boolean;
  onResultChange?: (result: OcrResult) => void;
  onClearResult?: () => void;
}

export function ResultsPanel({ result, isProcessing, onResultChange, onClearResult }: Props) {
  const [activeTab, setActiveTab] = useState<'raw' | 'formatted'>('formatted');
  const [copied, setCopied] = useState(false);

  if (isProcessing) {
    return (
      <div className="h-full bg-white dark:bg-slate-900 border-none flex flex-col items-center justify-center p-8 space-y-6">
        <div className="text-[14px] font-bold text-amber-500 dark:text-amber-400 uppercase tracking-widest flex items-center">
          EXTRACTING TEXT <span className="animate-dots w-4 text-left inline-block"></span>
        </div>
        <div className="w-full max-w-md bg-slate-100 dark:bg-slate-800 h-1.5 border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="bg-emerald-500 h-full w-[30%] animate-pulse"></div>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono text-center uppercase tracking-widest leading-relaxed max-w-xs">
          THIS MAY TAKE A MOMENT DEPENDING ON THE SELECTED PROVIDER AND IMAGE COMPLEXITY.
        </p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="h-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-8">
        <p className="text-slate-500 dark:text-slate-400 text-center max-w-sm">
          Upload an image and click "Extract Text" to see the output here.
        </p>
      </div>
    );
  }

  const hasFormatted = !!result.mergedFormattedText;
  const contentToDisplay = activeTab === 'formatted' && hasFormatted 
    ? result.mergedFormattedText 
    : result.mergedRawText;

  const handleEdit = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!onResultChange) return;
    const newText = e.target.value;
    if (activeTab === 'formatted' && hasFormatted) {
      onResultChange({ ...result, mergedFormattedText: newText });
    } else {
      onResultChange({ ...result, mergedRawText: newText });
    }
  };

  const handleCopy = async () => {
    if (!contentToDisplay) return;
    await navigator.clipboard.writeText(contentToDisplay);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!contentToDisplay) return;
    const blob = new Blob([contentToDisplay], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ocr-result-${activeTab}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white dark:bg-slate-900 h-full flex flex-col overflow-hidden">
      {/* Terminal Tabs */}
      <div className="flex items-center bg-slate-100 dark:bg-[#1e1e1e] border-b border-slate-200 dark:border-slate-800 h-10 select-none overflow-x-auto no-scrollbar">
        <div className="flex h-full">
          {hasFormatted && (
            <div 
              onClick={() => setActiveTab('formatted')}
              className={`flex items-center h-full px-4 border-r border-slate-200 dark:border-slate-800 cursor-pointer min-w-[160px] transition-colors group relative ${
                activeTab === 'formatted'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 font-bold border-t-2 border-t-emerald-500'
                  : 'bg-slate-50 dark:bg-[#181818] text-slate-500 dark:text-slate-500 hover:bg-white dark:hover:bg-[#252525] hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <span className="text-[11px] uppercase tracking-widest truncate mr-4">FORMATTED OUTPUT</span>
              <button 
                onClick={(e) => { e.stopPropagation(); onClearResult?.(); }}
                className="absolute right-2 p-0.5 rounded-sm hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-red-500 transition-opacity opacity-0 group-hover:opacity-100"
              >
                <X size={12} />
              </button>
            </div>
          )}
          <div 
            onClick={() => setActiveTab('raw')}
            className={`flex items-center h-full px-4 border-r border-slate-200 dark:border-slate-800 cursor-pointer min-w-[160px] transition-colors group relative ${
              activeTab === 'raw'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 font-bold border-t-2 border-t-emerald-500'
                : 'bg-slate-50 dark:bg-[#181818] text-slate-500 dark:text-slate-500 hover:bg-white dark:hover:bg-[#252525] hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <span className="text-[11px] uppercase tracking-widest truncate mr-4">RAW OCR TEXT</span>
            <button 
              onClick={(e) => { e.stopPropagation(); onClearResult?.(); }}
              className="absolute right-2 p-0.5 rounded-sm hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-red-500 transition-opacity opacity-0 group-hover:opacity-100"
            >
              <X size={12} />
            </button>
          </div>
        </div>
        <div className="flex-1 h-full bg-slate-50 dark:bg-[#181818]"></div>
      </div>

      {/* Warnings area */}
      {result.warnings.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 p-3 flex items-start gap-2">
          <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={16} />
          <ul className="text-sm text-amber-700 dark:text-amber-400 list-disc pl-4 space-y-1">
            {result.warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 p-4 overflow-y-auto">
        <textarea
          value={contentToDisplay || ''}
          onChange={handleEdit}
          className="w-full h-full min-h-[300px] bg-transparent border-none resize-none focus:ring-0 focus:outline-none text-slate-800 dark:text-slate-200 font-mono text-sm leading-relaxed"
          placeholder="Extracted text will appear here. You can manually edit it if needed..."
        />
      </div>

      {/* Action Bar */}
      <div className="flex bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-b-none overflow-hidden shrink-0 font-mono">
        <button 
          onClick={handleCopy}
          className="flex-1 py-2.5 flex items-center justify-center text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors border-r border-slate-200 dark:border-slate-800"
          title="Copy to Clipboard"
        >
          {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
        </button>
        <button 
          onClick={handleDownload}
          className="flex-1 py-2.5 flex items-center justify-center text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors border-r border-slate-200 dark:border-slate-800"
          title="Download .txt"
        >
          <Download size={18} />
        </button>
        <button 
          onClick={onClearResult}
          className="flex-1 py-2.5 flex items-center justify-center text-slate-800 dark:text-white hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          title="Clear Output"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Footer Info */}
      <div className="bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-3 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
        <div>
          Images Processed: {result.files.length}
        </div>
        <div>
          Generated by: <span className="font-medium capitalize">{result.providerUsed}</span> ({result.modelUsed})
        </div>
      </div>
    </div>
  );
}
