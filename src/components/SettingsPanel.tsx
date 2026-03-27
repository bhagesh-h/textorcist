import { useEffect, useState } from 'react';
import { useStore } from '../lib/store';
import { X } from 'lucide-react';

export function SettingsPanel() {
  const { 
    provider, setProvider,
    openRouterKey, setOpenRouterKey, openRouterModel, setOpenRouterModel,
    hfKey, setHfKey, hfModel, setHfModel,
    ollamaUrl, setOllamaUrl, ollamaModel, setOllamaModel, ollamaAccelerator, setOllamaAccelerator,
    googleKey, setGoogleKey, googleModel, setGoogleModel,
    customUrl, setCustomUrl, customKey, setCustomKey, customModel, setCustomModel,
    showSettings, setShowSettings
  } = useStore();

  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [openRouterModels, setOpenRouterModels] = useState<{id: string, name: string}[]>([]);
  const [isOllamaAvailable, setIsOllamaAvailable] = useState(false);

  useEffect(() => {
    const checkOllama = async () => {
      try {
        const isNgrok = ollamaUrl.includes('ngrok');
        const res = await fetch(`${ollamaUrl}/api/tags`, {
          headers: isNgrok ? { 'ngrok-skip-browser-warning': 'true' } : {}
        });
        if (res.ok) {
          const data = await res.json();
          const models = data.models?.map((m: any) => m.name) || [];
          setOllamaModels(models);
          setIsOllamaAvailable(true);
        } else {
          setIsOllamaAvailable(false);
        }
      } catch (err) {
        setIsOllamaAvailable(false);
      }
    };
    checkOllama();
  }, [ollamaUrl]);

  useEffect(() => {
    const fetchORModels = async () => {
      try {
        const res = await fetch('https://openrouter.ai/api/v1/models');
        if (res.ok) {
          const data = await res.json();
          setOpenRouterModels(
            data.data
              .map((m: any) => ({ id: m.id, name: m.name }))
              .sort((a: any, b: any) => a.id.localeCompare(b.id))
          );
        }
      } catch (e) {
        console.error("Failed to fetch OpenRouter models", e);
      }
    };
    fetchORModels();
  }, []);

  if (!showSettings) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">&gt;_ SETTINGS</h2>
          <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-red-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-4 flex-1 text-sm bg-slate-50 dark:bg-slate-950">
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-500 border-b border-slate-200 dark:border-slate-800 pb-2 uppercase tracking-wider">Active Provider</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {(['openrouter', 'ollama', 'huggingface', 'google', 'custom'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setProvider(p)}
                  className={`p-2 border text-[11px] text-center font-bold uppercase tracking-widest flex flex-col items-center justify-center transition-all ${
                    provider === p 
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-white' 
                      : 'border-slate-200 hover:bg-slate-100 text-slate-600 dark:border-slate-800 dark:text-slate-500 dark:hover:bg-slate-900'
                  }`}
                >
                  <span>{p === 'custom' ? 'CUSTOM API' : p === 'openrouter' ? 'OPENROUTER' : p === 'ollama' ? 'OLLAMA' : p === 'huggingface' ? 'HUGGINGFACE' : p.toUpperCase()}</span>
                  {p === 'ollama' && isOllamaAvailable && <span className="text-[9px] text-emerald-600 mt-0.5 uppercase tracking-widest font-black">ONLINE LOCALLY</span>}
                </button>
              ))}
            </div>
          </div>

          {/* OpenRouter */}
          {provider === 'openrouter' && (
            <div className="space-y-3 p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 mt-4 animate-in fade-in">
              <h3 className="text-xs font-bold text-slate-700 dark:text-emerald-500 uppercase tracking-widest mb-3">OPENROUTER CONFIGURATION</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono uppercase">OpenRouter provides access to dozens of models, including entirely free ones.</p>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">API KEY</label>
                <input 
                  type="password" 
                  value={openRouterKey}
                  onChange={(e) => setOpenRouterKey(e.target.value)}
                  placeholder="sk-or-..."
                  className="w-full px-3 py-1.5 rounded-none font-mono text-xs bg-white border border-slate-200 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">MODEL</label>
                <select 
                  value={openRouterModel}
                  onChange={(e) => setOpenRouterModel(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-none font-mono text-xs bg-white border border-slate-200 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200 focus:border-emerald-500 focus:outline-none"
                >
                  <optgroup label="Free Models">
                    <option value="qwen/qwen-vl-plus:free">Qwen VL Plus (Free)</option>
                    <option value="meta-llama/llama-3.2-11b-vision-instruct:free">Llama 3.2 11B Vision (Free)</option>
                  </optgroup>
                  <optgroup label="Paid / Standard">
                    <option value="google/gemini-2.5-flash">Google Gemini 2.5 Flash</option>
                  </optgroup>
                  <optgroup label="All Models">
                    {openRouterModels.map(m => (
                      <option key={m.id} value={m.id}>{m.id} - {m.name}</option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>
          )}

          {/* Ollama */}
          {provider === 'ollama' && (
            <div className="space-y-3 p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 mt-4 animate-in fade-in">
              <h3 className="text-xs font-bold text-slate-700 dark:text-emerald-500 uppercase tracking-widest mb-3">OLLAMA CONFIGURATION</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono uppercase">Connect to your local or cloud Ollama instance. If using a remote/cloud Ollama server, just paste its URL here.</p>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">OLLAMA BASE URL</label>
                <input 
                  type="text" 
                  value={ollamaUrl}
                  onChange={(e) => setOllamaUrl(e.target.value)}
                  placeholder="http://localhost:11434"
                  className="w-full px-3 py-1.5 rounded-none font-mono text-xs bg-white border border-slate-200 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">MODEL</label>
                {isOllamaAvailable ? (
                  <div className="relative">
                    <input 
                      list="ollama-models"
                      value={ollamaModel}
                      onChange={(e) => setOllamaModel(e.target.value)}
                      placeholder="e.g. llama3.2-vision, moondream"
                      className="w-full px-3 py-1.5 rounded-none font-mono text-xs bg-white border border-slate-200 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                    <datalist id="ollama-models">
                      <option value="moondream">Moondream (Tiny, ~1GB RAM)</option>
                      <option value="minicpm-v">MiniCPM-V (Small, ~4GB RAM)</option>
                      <option value="llama3.2-vision">Llama 3.2 Vision (Medium, ~8GB RAM)</option>
                      {ollamaModels.map(m => (
                        <option key={m} value={m} />
                      ))}
                    </datalist>
                    <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                      Select installed or <span className="font-semibold text-emerald-600 dark:text-emerald-400">type any cloud library model</span> to auto-download!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-[11px] dark:bg-red-900/10 dark:text-red-400 dark:border-red-900/50 font-mono">
                      <p className="font-bold mb-1 uppercase tracking-widest">Connection Failure</p>
                      <p>Could not connect to Ollama at `{ollamaUrl}`.</p>
                      
                      {window.location.protocol === 'https:' && ollamaUrl.startsWith('http:') && (
                        <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-900/50 space-y-2">
                          <p className="text-amber-600 dark:text-amber-400 font-bold uppercase tracking-tighter">[SECURITY BLOCK DETECTED]</p>
                          <p>You are using HTTPS (Render), but trying to connect to HTTP (Local). Browsers block this by default.</p>
                          <div className="bg-white/50 dark:bg-black/20 p-2 rounded border border-red-100 dark:border-red-900/30">
                            <p className="font-bold mb-1 underline">FIXES:</p>
                            <ul className="list-disc pl-4 space-y-1">
                              <li>Set <code className="bg-red-100 dark:bg-red-900/40 px-1 text-[10px]">OLLAMA_ORIGINS="*"</code> locally.</li>
                              <li>Use a tunnel: <code className="bg-red-100 dark:bg-red-900/40 px-1 text-[10px]">ngrok http 11434</code> and paste the HTTPS URL above.</li>
                              <li>Or, allow "Insecure Content" in Site Settings (Chrome).</li>
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">HARDWARE ACCELERATION</label>
                <select 
                  value={ollamaAccelerator}
                  onChange={(e) => setOllamaAccelerator(e.target.value as any)}
                  className="w-full px-3 py-1.5 rounded-none font-mono text-xs bg-white border border-slate-200 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="gpu">Dedicated GPU (NVIDIA / AMD)</option>
                  <option value="npu">NPU (Intel / Copilot+ PC)</option>
                  <option value="cpu">CPU Only (Very Slow)</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">Note: NPU acceleration requires an NPU-compatible Ollama build (e.g. OpenVINO) on Windows.</p>
              </div>
            </div>
          )}

          {/* Google */}
          {provider === 'google' && (
            <div className="space-y-3 p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 mt-4 animate-in fade-in">
              <h3 className="text-xs font-bold text-slate-700 dark:text-emerald-500 uppercase tracking-widest mb-3">GOOGLE GEMINI CONFIGURATION</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono uppercase">Direct integration with Google AI Studio.</p>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">API KEY</label>
                <input 
                  type="password" 
                  value={googleKey}
                  onChange={(e) => setGoogleKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3 py-1.5 rounded-none font-mono text-xs bg-white border border-slate-200 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">MODEL</label>
                <select 
                  value={googleModel}
                  onChange={(e) => setGoogleModel(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-none font-mono text-xs bg-white border border-slate-200 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                  <option value="gemini-1.5-flash-8b">Gemini 1.5 Flash-8B</option>
                </select>
              </div>
            </div>
          )}

          {/* Custom */}
          {provider === 'custom' && (
            <div className="space-y-3 p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 mt-4 animate-in fade-in">
              <h3 className="text-xs font-bold text-slate-700 dark:text-emerald-500 uppercase tracking-widest mb-3">CUSTOM PROVIDER CONFIGURATION</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono uppercase">Configure any OpenAI-compatible API endpoint (e.g., Groq, Together, vLLM, Azure). Must support multi-modal payload schemas.</p>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">BASE URL</label>
                <input 
                  type="text" 
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://api.yourprovider.com/v1"
                  className="w-full px-3 py-1.5 rounded-none font-mono text-xs bg-white border border-slate-200 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">API KEY (OPTIONAL)</label>
                <input 
                  type="password" 
                  value={customKey}
                  onChange={(e) => setCustomKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-3 py-1.5 rounded-none font-mono text-xs bg-white border border-slate-200 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">MODEL ID</label>
                <input 
                  type="text" 
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                  placeholder="e.g. llama-3.2-90b-vision-preview"
                  className="w-full px-3 py-1.5 rounded-none font-mono text-xs bg-white border border-slate-200 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Hugging Face */}
          {provider === 'huggingface' && (
            <div className="space-y-3 p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 mt-4 animate-in fade-in">
              <h3 className="text-xs font-bold text-slate-700 dark:text-emerald-500 uppercase tracking-widest mb-3">HUGGING FACE CONFIGURATION</h3>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">API KEY (ACCESS TOKEN)</label>
                <input 
                  type="password" 
                  value={hfKey}
                  onChange={(e) => setHfKey(e.target.value)}
                  placeholder="hf_..."
                  className="w-full px-3 py-1.5 rounded-none font-mono text-xs bg-white border border-slate-200 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">MODEL / ENDPOINT URL</label>
                <input 
                  type="text" 
                  value={hfModel}
                  onChange={(e) => setHfModel(e.target.value)}
                  placeholder="e.g. meta-llama/Llama-3.2-11B-Vision-Instruct"
                  className="w-full px-3 py-1.5 rounded-none font-mono text-xs bg-white border border-slate-200 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end">
          <button 
            onClick={() => setShowSettings(false)}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 border border-emerald-500 dark:border-emerald-800 text-white font-mono text-xs font-bold tracking-widest uppercase transition-colors dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 dark:text-emerald-400"
          >
            SAVE & CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}

