export type Provider = 'openrouter' | 'ollama' | 'huggingface' | 'google' | 'custom';

export interface ProviderConfig {
  id: Provider;
  name: string;
  apiKey?: string;
  baseUrl?: string; 
  defaultModel: string;
  isLocal?: boolean;
}

export interface OcrResult {
  files: {
    fileName: string;
    rawText: string;
    formattedText?: string;
    status: 'pending' | 'processing' | 'success' | 'error';
    error?: string;
  }[];
  mergedRawText: string;
  mergedFormattedText?: string;
  modelUsed: string;
  providerUsed: Provider;
  warnings: string[];
}

export interface AppState {
  providers: Record<Provider, ProviderConfig>;
  activeProvider: Provider;
  selectedModel: string;
  useGpuForOllama: boolean;
  template: string;
  isProcessing: boolean;
}
