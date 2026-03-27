import { useState, useEffect, useRef } from 'react';
import { Settings, Wand2, AlertCircle, StopCircle, Sun, Moon } from 'lucide-react';
import { useStore } from './lib/store';
import { SettingsPanel } from './components/SettingsPanel';
import { UploadDropzone } from './components/UploadDropzone';
import { TemplateEditor } from './components/TemplateEditor';
import { ResultsPanel } from './components/ResultsPanel';
import { HardwareMonitor } from './components/HardwareMonitor';
import { processOcrRequest, formatTextWithTemplate } from './lib/ocrService';
import type { OcrResult } from './lib/types';

function App() {
  const { theme, toggleTheme, setShowSettings, provider, openRouterModel, ollamaModel, hfModel, googleModel, customModel } = useStore();
  const [files, setFiles] = useState<File[]>([]);
  const [template, setTemplate] = useState('');
  const [result, setResult] = useState<OcrResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  // Apply dark mode class
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleProcess = async () => {
    if (files.length === 0) {
      setGlobalError("Please upload at least one image.");
      return;
    }
    setGlobalError("");
    setIsProcessing(true);
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    const ocrResult: OcrResult = {
      files: files.map(f => ({ fileName: f.name, rawText: '', status: 'pending' })),
      mergedRawText: '',
      mergedFormattedText: '',
      modelUsed: provider === 'openrouter' ? openRouterModel : provider === 'ollama' ? ollamaModel : provider === 'google' ? googleModel : provider === 'custom' ? customModel : hfModel,
      providerUsed: provider,
      warnings: []
    };

    try {
      // Process sequentially to avoid rate limits or overwhelming local models
      let allRawText = '';
      
      for (let i = 0; i < files.length; i++) {
        ocrResult.files[i].status = 'processing';
        setResult({ ...ocrResult });

        try {
          let currentMerged = allRawText + `--- Page: ${files[i].name} ---\n`;
          let currentFileText = '';

          const rawOutput = await processOcrRequest(
            files[i], 
            '', 
            useStore.getState(), 
            signal,
            (chunk: string) => {
              currentFileText += chunk;
              ocrResult.files[i].rawText = currentFileText;
              ocrResult.mergedRawText = currentMerged + currentFileText;
              setResult({ ...ocrResult });
            }
          );
          
          ocrResult.files[i].rawText = rawOutput;
          allRawText += `--- Page: ${files[i].name} ---\n${rawOutput}\n\n`;
          ocrResult.files[i].status = 'success';
        } catch (e: any) {
          if (e.name === 'AbortError' || e.message.includes('abort')) {
             ocrResult.files[i].status = 'error';
             ocrResult.warnings.push(`File ${files[i].name} stopped.`);
             break; // Halt loop
          }
          ocrResult.files[i].status = 'error';
          ocrResult.files[i].error = e.message;
          ocrResult.warnings.push(`File ${files[i].name} failed: ${e.message}`);
        }
      }

      // Merge raw results
      ocrResult.mergedRawText = allRawText.trim();
      setResult({ ...ocrResult });
      
      // Secondary Phase: Format everything collectively if template exists
      if (template.trim() && ocrResult.mergedRawText && !signal.aborted) {
        try {
          let formatTextStr = '';
          const formattedOutput = await formatTextWithTemplate(
            ocrResult.mergedRawText, 
            template, 
            useStore.getState(),
            signal,
            (chunk: string) => {
               formatTextStr += chunk;
               ocrResult.mergedFormattedText = formatTextStr;
               setResult({ ...ocrResult });
            }
          );
          ocrResult.mergedFormattedText = formattedOutput;
        } catch (e: any) {
          if (e.name !== 'AbortError' && !e.message.includes('abort')) {
             ocrResult.warnings.push(`Template formatting failed: ${e.message}`);
          }
        }
      }

    } catch (e: any) {
      if (e.name !== 'AbortError' && !e.message.includes('abort')) {
        ocrResult.warnings.push(`Process failed completely: ${e.message}`);
      }
    } finally {
      setIsProcessing(false);
      setResult({ ...ocrResult });
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const processedCount = result?.files.filter(f => f.status === 'success' || f.status === 'error').length || 0;
  const progressPercent = files.length > 0 ? (processedCount / files.length) * 100 : 0;

  return (
    <div className="h-screen w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-200 flex flex-col font-sans overflow-hidden">
      
      {/* Header */}
      <header className="shrink-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="w-full px-2 lg:px-4 py-2 flex flex-wrap items-center justify-between">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-mono font-bold text-emerald-500 tracking-tight flex items-center uppercase">
              <span className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-sm mr-2 text-lg leading-none border border-emerald-500/20 font-black">&gt;_</span>
              TEXTORCIST
              <span className="ml-2 hidden sm:inline-block text-slate-900 dark:text-white">OCR</span>
            </h1>
          </div>
          
          <div className="flex flex-1 sm:flex-none flex-wrap sm:flex-nowrap items-center justify-end gap-2 sm:gap-4 w-full sm:w-auto">
            <div className="w-full sm:w-auto order-last sm:order-none overflow-x-auto pb-1 sm:pb-0 flex justify-center sm:block">
              <HardwareMonitor />
            </div>
            
            <div className="flex items-center space-x-0">
              <div className="text-xs pr-3 font-bold text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800 flex items-center uppercase tracking-wider">
                PROVIDER: <span className="uppercase ml-1 tracking-widest text-slate-800 dark:text-white">{provider}</span>
              </div>
              <button 
                onClick={() => setShowSettings(true)}
                className="p-2 text-slate-500 hover:text-emerald-600 dark:text-slate-200 dark:hover:text-white transition-colors"
                title="Settings"
              >
                <Settings size={20} />
              </button>
              <button 
                onClick={toggleTheme}
                className="p-2 text-slate-500 hover:text-emerald-600 dark:text-slate-200 dark:hover:text-white transition-colors"
                title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full flex flex-col xl:flex-row overflow-y-auto xl:overflow-hidden bg-slate-50 dark:bg-slate-950">
        
        {/* Left Column: Upload & Actions */}
        <div className="w-full xl:w-[320px] 2xl:w-[380px] flex flex-col shrink-0 xl:overflow-y-auto custom-scrollbar border-b xl:border-b-0 xl:border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <UploadDropzone
            files={files}
            fileStatuses={files.map(f => result?.files.find(r => r.fileName === f.name)?.status || 'pending')}
            onFilesAdded={(newFiles) => setFiles([...files, ...newFiles])}
            onRemoveFile={(idx) => setFiles(files.filter((_, i) => i !== idx))}
            onClearFiles={() => setFiles([])}
          />
          
          <div className="mt-auto flex flex-col">
            {globalError && (
              <div className="p-2 bg-red-50 text-red-600 text-sm border-t border-red-100 flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <p>{globalError}</p>
              </div>
            )}

            {isProcessing && (
              <div className="w-full flex flex-col items-center gap-1.5 px-2 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="w-full flex justify-between items-center mb-0.5">
                  <div className="text-[11px] font-bold text-amber-500 dark:text-amber-400 uppercase tracking-widest flex items-center">
                    PROCESSING <span className="animate-dots w-4 text-left inline-block"></span>
                  </div>
                  <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {Math.round(progressPercent)}%
                  </div>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 border border-slate-300 dark:border-slate-700">
                  <div className="bg-emerald-500 h-full transition-all duration-300 relative" style={{ width: `${Math.max(2, progressPercent)}%` }}>
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </div>
                </div>
                <div className="text-[9px] text-slate-500 dark:text-slate-400 font-mono tracking-widest uppercase mt-0.5">
                  TASK: {processedCount} / {files.length} NODES COMPLETED
                </div>
              </div>
            )}
            
            {isProcessing ? (
              <button 
                onClick={handleStop}
                className="w-full py-4 font-bold text-[15px] bg-yellow-50 hover:bg-yellow-100 text-yellow-600 border-t border-yellow-200 dark:bg-yellow-900/10 dark:hover:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/50 flex items-center justify-center space-x-2 transition-colors uppercase tracking-widest"
                title="Stop Processing"
              >
                <StopCircle size={18} className="animate-pulse" />
                <span>STOP ENGINE</span>
              </button>
            ) : (
              <button 
                onClick={handleProcess}
                disabled={files.length === 0}
                className={`w-full py-4 font-bold text-[15px] flex items-center justify-center space-x-2 transition-all border-t uppercase tracking-widest
                  ${files.length === 0 
                    ? 'bg-red-50 border-red-200 text-red-500 dark:bg-red-900/10 dark:border-red-900/50 dark:text-red-400 cursor-not-allowed' 
                    : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-900/30 cursor-pointer'
                  }`}
              >
                <Wand2 size={18} />
                <span>EXTRACT TEXT</span>
              </button>
            )}
          </div>
        </div>

        {/* Middle Column: Template Editor */}
        <div className="w-full xl:w-[340px] 2xl:w-[420px] shrink-0 min-h-[400px] xl:min-h-0 flex flex-col border-b xl:border-b-0 xl:border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <TemplateEditor template={template} onChange={setTemplate} />
        </div>

        {/* Right Column: Results */}
        <div className="w-full xl:flex-1 h-[600px] xl:h-full xl:min-h-0 flex flex-col bg-white dark:bg-slate-900 border-b xl:border-b-0 border-slate-200 dark:border-slate-800">
          <ResultsPanel result={result} isProcessing={isProcessing} onResultChange={setResult} onClearResult={() => setResult(null)} />
        </div>

      </main>

      {/* Footer */}
      <footer className="shrink-0 w-full border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-2 px-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 dark:text-slate-200 font-mono tracking-widest uppercase">
        <div className="flex items-center space-x-2">
          <span>&copy; {new Date().getFullYear()} Created by Bhagesh</span>
        </div>
        <div className="flex items-center space-x-4 mt-2 sm:mt-0">
          <a href="https://github.com/bhagesh-h" target="_blank" rel="noreferrer" className="flex items-center space-x-1.5 hover:text-emerald-500 dark:hover:text-white transition-colors" title="GitHub">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
          </a>
          <a href="https://www.linkedin.com/in/bhagesh-hunakunti/" target="_blank" rel="noreferrer" className="flex items-center space-x-1.5 hover:text-emerald-500 dark:hover:text-white transition-colors" title="LinkedIn">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
          </a>
        </div>
      </footer>
      
      <SettingsPanel />
    </div>
  );
}

export default App;
