import type { AppState } from './store';
import type { Provider } from './types';

// Convert browser File to base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export async function processOcrRequest(
  file: File,
  template: string,
  state: AppState,
  signal?: AbortSignal,
  onChunk?: (chunk: string) => void
): Promise<string> {
  const base64Image = await fileToBase64(file);
  const systemPrompt = template 
    ? `Transcribe the text from this image and map it perfectly into this template structure:\n${template}`
    : `Transcribe all text from this image accurately.`;

  return await routeRequest(base64Image, systemPrompt, state, file.type, signal, onChunk);
}

export async function formatTextWithTemplate(
  rawText: string,
  template: string,
  state: AppState,
  signal?: AbortSignal,
  onChunk?: (chunk: string) => void
): Promise<string> {
  const prompt = `Reformat the following extracted text strictly according to this template. Output exactly and only the mapped result without introductory text.\n\n[TEMPLATE]\n${template}\n\n[EXTRACTED TEXT]\n${rawText}`;
  return await routeRequest("", prompt, state, "text/plain", signal, onChunk);
}

async function routeRequest(base64Image: string, systemPrompt: string, state: AppState, mimeType: string, signal?: AbortSignal, onChunk?: (chunk: string) => void): Promise<string> {
  switch (state.provider) {
    case 'openrouter':
      return await callOpenRouter(base64Image, systemPrompt, state, signal, onChunk);
    case 'ollama':
      return await callOllama(base64Image, systemPrompt, state, signal, onChunk);
    case 'google':
      return await callGoogle(base64Image, systemPrompt, state, mimeType, signal);
    case 'custom':
      return await callCustomOpenAI(base64Image, systemPrompt, state, signal);
    case 'huggingface':
      return await callHuggingFace(base64Image, systemPrompt, state, signal);
    default:
      throw new Error(`Unknown provider: ${state.provider}`);
  }
}

async function callOpenRouter(base64Image: string, systemPrompt: string, state: AppState, signal?: AbortSignal, onChunk?: (chunk: string) => void): Promise<string> {
  if (!state.openRouterKey) throw new Error("OpenRouter API Key is missing");
  
  const content = base64Image 
    ? [
        { type: "text", text: systemPrompt },
        { type: "image_url", image_url: { url: base64Image } }
      ]
    : systemPrompt;

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${state.openRouterKey}`,
      "HTTP-Referer": window.location.origin,
      "X-Title": "Textorcist OCR",
      "Content-Type": "application/json"
    },
    signal,
    body: JSON.stringify({
      model: state.openRouterModel,
      stream: !!onChunk,
      messages: [
        {
          role: "user",
          content: content
        }
      ]
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`OpenRouter Error ${res.status}: ${err.error?.message || err.message || JSON.stringify(err)}`);
  }

  if (onChunk) {
    return await handleSSE(res, onChunk);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

async function callOllama(base64Image: string, systemPrompt: string, state: AppState, signal?: AbortSignal, onChunk?: (chunk: string) => void): Promise<string> {
  // 1. Check if model exists, if not pull it
  try {
    const tagsRes = await fetch(`${state.ollamaUrl}/api/tags`, { signal });
    if (tagsRes.ok) {
      const data = await tagsRes.json();
      const models = data.models?.map((m: any) => m.name) || [];
      if (!models.includes(state.ollamaModel)) {
        await fetch(`${state.ollamaUrl}/api/pull`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: state.ollamaModel }),
          signal
        });
      }
    }
  } catch (e) {
    console.warn("Could not check/pull Ollama model silently:", e);
  }

  const options: any = {
    temperature: 0.1,
  };
  
  if (state.ollamaAccelerator === 'cpu') {
    options.num_gpu = 0;
  }
  
  const messages: any[] = [
    {
      role: "user",
      content: systemPrompt
    }
  ];

  if (base64Image) {
    const base64Data = base64Image.split(',')[1] || base64Image;
    messages[0].images = [base64Data];
  }

  const res = await fetch(`${state.ollamaUrl}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    signal,
    body: JSON.stringify({
      model: state.ollamaModel,
      messages: messages,
      stream: !!onChunk,
      options
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Ollama Error ${res.status}: ${errText}`);
  }

  if (onChunk) {
    return await handleOllamaStream(res, onChunk);
  }

  const data = await res.json();
  return data.message?.content || "";
}

async function callGoogle(base64Image: string, systemPrompt: string, state: AppState, mimeType: string, signal?: AbortSignal): Promise<string> {
  if (!state.googleKey) throw new Error("Google API Key is missing");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${state.googleModel}:generateContent?key=${state.googleKey}`;
  
  const parts: any[] = [{ text: systemPrompt }];
  
  if (base64Image) {
    const base64Data = base64Image.split(',')[1] || base64Image;
    parts.unshift({
      inline_data: {
        mime_type: mimeType || 'image/jpeg',
        data: base64Data
      }
    });
    parts[1].text = "Extract the text from this image."; // Override the prompt string slightly for vision
  }
  
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify({
      system_instruction: base64Image ? undefined : {
        parts: [{ text: "You are a formatting assistant." }]
      },
      contents: [{
        parts: parts
      }]
    })
  });

  if (!res.ok) {
    throw new Error(`Google Error ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

async function callCustomOpenAI(base64Image: string, systemPrompt: string, state: AppState, signal?: AbortSignal): Promise<string> {
  if (!state.customUrl) throw new Error("Custom Base URL is missing");
  if (!state.customModel) throw new Error("Custom Model ID is missing");

  let url = state.customUrl;
  if (!url.endsWith('/completions')) {
         url = url.replace(/\/+$/, '') + '/chat/completions';
  }

  const content = base64Image 
    ? [
        { type: "text", text: systemPrompt },
        { type: "image_url", image_url: { url: base64Image } }
      ]
    : systemPrompt;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${state.customKey}`,
      "Content-Type": "application/json"
    },
    signal,
    body: JSON.stringify({
      model: state.customModel,
      messages: [
        {
          role: "user",
          content: content
        }
      ]
    })
  });

  if (!res.ok) {
    throw new Error(`Custom API Error ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

async function callHuggingFace(base64Image: string, systemPrompt: string, state: AppState, signal?: AbortSignal): Promise<string> {
  if (!state.hfKey) throw new Error("Hugging Face API Key is missing");
  if (!state.hfModel) throw new Error("Hugging Face Model is not specified");
  
  throw new Error("Hugging Face vision models require highly specific payload schemas per-model. Please use OpenRouter for standardized HF model access.");
}

// ---- Stream Parsers ----

async function handleSSE(res: Response, onChunk: (chunk: string) => void): Promise<string> {
  const reader = res.body?.getReader();
  const decoder = new TextDecoder("utf-8");
  let fullText = "";
  
  if (!reader) throw new Error("No response body to stream");
  
  while(true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunkStr = decoder.decode(value, { stream: true });
    const lines = chunkStr.split('\n');
    for (const line of lines) {
      if (line.trim().startsWith('data: ') && line.trim() !== 'data: [DONE]') {
        try {
          const json = JSON.parse(line.trim().substring(6));
          const content = json.choices?.[0]?.delta?.content || "";
          if (content) {
            fullText += content;
            onChunk(content);
          }
        } catch (e) { /* partial json chunk */ }
      }
    }
  }
  return fullText;
}

async function handleOllamaStream(res: Response, onChunk: (chunk: string) => void): Promise<string> {
  const reader = res.body?.getReader();
  const decoder = new TextDecoder("utf-8");
  let fullText = "";
  if (!reader) throw new Error("No response body to stream");
  
  while(true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunkStr = decoder.decode(value, { stream: true });
    // Ollama streams loose JSON objects separated by newlines
    const lines = chunkStr.split('\n');
    for (const line of lines) {
      if (line.trim()) {
        try {
          const json = JSON.parse(line.trim());
          const content = json.message?.content || "";
          if (content) {
            fullText += content;
            onChunk(content);
          }
        } catch (e) { /* partial json chunk */ }
      }
    }
  }
  return fullText;
}
