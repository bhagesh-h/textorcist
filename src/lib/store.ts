import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Provider } from './types';

export interface AppState {
  theme: 'dark' | 'light';
  toggleTheme: () => void;

  provider: Provider;
  setProvider: (p: Provider) => void;

  openRouterKey: string;
  setOpenRouterKey: (v: string) => void;
  openRouterModel: string;
  setOpenRouterModel: (v: string) => void;

  hfKey: string;
  setHfKey: (v: string) => void;
  hfModel: string;
  setHfModel: (v: string) => void;

  ollamaUrl: string;
  setOllamaUrl: (v: string) => void;
  ollamaModel: string;
  setOllamaModel: (v: string) => void;
  ollamaAccelerator: 'gpu' | 'npu' | 'cpu';
  setOllamaAccelerator: (v: 'gpu' | 'npu' | 'cpu') => void;

  googleKey: string;
  setGoogleKey: (v: string) => void;
  googleModel: string;
  setGoogleModel: (v: string) => void;

  customUrl: string;
  setCustomUrl: (v: string) => void;
  customKey: string;
  setCustomKey: (v: string) => void;
  customModel: string;
  setCustomModel: (v: string) => void;

  showSettings: boolean;
  setShowSettings: (v: boolean) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'dark',
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      
      provider: 'openrouter',
      setProvider: (p) => set({ provider: p }),

      openRouterKey: '',
      setOpenRouterKey: (k) => set({ openRouterKey: k }),
      openRouterModel: 'qwen/qwen-vl-plus:free',
      setOpenRouterModel: (m) => set({ openRouterModel: m }),

      hfKey: '',
      setHfKey: (k) => set({ hfKey: k }),
      hfModel: 'meta-llama/Llama-3.2-11B-Vision-Instruct',
      setHfModel: (m) => set({ hfModel: m }),

      ollamaUrl: 'http://localhost:11434',
      setOllamaUrl: (u) => set({ ollamaUrl: u }),
      ollamaModel: 'moondream',
      setOllamaModel: (m) => set({ ollamaModel: m }),
      ollamaAccelerator: 'gpu',
      setOllamaAccelerator: (v) => set({ ollamaAccelerator: v }),

      googleKey: '',
      setGoogleKey: (k) => set({ googleKey: k }),
      googleModel: 'gemini-2.5-flash',
      setGoogleModel: (m) => set({ googleModel: m }),

      customUrl: '',
      setCustomUrl: (u) => set({ customUrl: u }),
      customKey: '',
      setCustomKey: (k) => set({ customKey: k }),
      customModel: '',
      setCustomModel: (m) => set({ customModel: m }),

      showSettings: false,
      setShowSettings: (v) => set({ showSettings: v })
    }),
    {
      name: 'textorcist-storage',
      partialize: (state) => ({ 
        theme: state.theme,
        provider: state.provider,
        openRouterKey: state.openRouterKey,
        openRouterModel: state.openRouterModel,
        hfKey: state.hfKey,
        hfModel: state.hfModel,
        ollamaUrl: state.ollamaUrl,
        ollamaModel: state.ollamaModel,
        ollamaAccelerator: state.ollamaAccelerator,
        googleKey: state.googleKey,
        googleModel: state.googleModel,
        customUrl: state.customUrl,
        customKey: state.customKey,
        customModel: state.customModel
      })
    }
  )
);
