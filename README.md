<p align="center">
  <img src="public/branding.svg" width="400" alt="TEXTORCIST OCR Logo" />
</p>

# Textorcist

Textorcist is a modern, API-first client-side OCR web application designed to extract and format handwritten text from images. Developed with React, TypeScript, and Vite, it offers an entirely local, browser-based experience without relying on a back-end server for data processing or file storage.

## Features

- **Multiple OCR Providers Supported**:
  - **OpenRouter**: Use high-powered vision models (like Gemini Pro, Qwen VL Plus) with your API key.
  - **Ollama**: Connect to a local Ollama instance (defaults to `http://localhost:11434`) for completely private, local OCR. Supports CPU/GPU configurations and auto-discovers available models.
  - **Hugging Face**: Use custom HF model endpoints as an alternative.

- **Client-Side Workflow**: 
  All image processing, Base64 conversion, and API communication occurs directly in the browser via native `fetch` requests. Files never leave your local machine except when sent securely to the selected text inference API.

- **Advanced Templating**: 
  Extract raw handwritten text or paste a custom template. The application will leverage the vision models to fit the recognized text exactly into your defined structure, handling placeholders and marking unreadable elements explicitly.

- **Multiple Image Selection**: 
  Drag and drop multiple handwritten notes simultaneously to process them collectively into partitioned results.

- **Dark Mode and Polished UI**: 
  Built using Tailwind CSS and Lucide React icons, offering a responsive design and seamless light/dark mode toggling.

- **Robust Export Options**: 
  Copy raw or formatted text directly to your clipboard or download it as plain text documents.

## Configuration & Usage

1. **Local Setup**:
   Ensure you have Node.js installed.
   ```bash
   git clone https://github.com/bhagesh-h/textorcist.git
   cd textorcist
   npm install
   npm run dev
   ```

2. **Accessing the App**:
   Navigate to `http://localhost:5173/` in your browser. Or, to preview the production build:
   ```bash
   npm run build
   npm start
   ```

3. **Setting Up Providers**:
   - Click the "Settings" icon (top right).
   - If you want to use **local inference**, ensure Ollama is running and select it as the active provider. The app will automatically populate your downloaded vision models.
   - If you want to use **OpenRouter**, paste your API token and select a model.
   - Keys are stored securely in your browser's Local Storage for persistence across sessions.

4. **Testing the Core Flow**:
   - Upload one or more image files (JPG, PNG, WEBP, BMP).
   - (Optional) Paste a formatting structure in the Template Editor.
   - Click "Extract Text". Toggle between "Formatted Output" and "Raw OCR Text" to view results.

6. **One-Click Deploy**:
   Click the "Deploy to Render" button (if configured) or manually connect your repository following the steps below.

## Deployment (Render.com)

Textorcist is a static frontend. You can easily deploy it on [Render](https://render.com/) or any other static site host (Vercel, Netlify, Cloudflare Pages).

### Deploying to Render
1. Create a new **Static Site** on Render.
2. Connect your GitHub repository.
3. Set the **Build Command** to: `npm install && npm run build`
4. Set the **Publish Directory** to: `dist`
5. Click **Deploy**.

*Note: Since this is a modern Node.js application, all dependencies are managed via `package.json` for a seamless build process.*

## API / CLI Usage (cURL)

Since Textorcist is a client-side wrapper, you can perform the same OCR operations directly from your terminal using the underlying providers.

### Local OCR (Ollama)
If Ollama is running (`llama3.2-vision` or `moondream`), use this to extract text from a local image:
```bash
# Convert your image to base64 first
IMAGE_B64=$(base64 -w 0 portrait.jpg)

curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2-vision",
  "prompt": "Extract all text from this image as raw markdown. Do not add any conversational filler.",
  "images": ["'"$IMAGE_B64"'"],
  "stream": false
}'
```

### Cloud OCR (OpenRouter)
To use a high-powered vision model (like Gemini 2.5 Flash) via CLI:
```bash
curl https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer $YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "google/gemini-2.5-flash",
    "messages": [
      {
        "role": "user",
        "content": [
          { "type": "text", "text": "OCR this image. Extract raw text." },
          { "type": "image_url", "image_url": { "url": "data:image/jpeg;base64,...B64_DATA..." } }
        ]
      }
    ]
  }'
```

## Requirements

- Node.js version 18+ 
- A modern web browser
- (Optional) Ollama installed locally for local execution
- (Optional) OpenRouter or HuggingFace API key for cloud execution

## Author

[Bhagesh Hunakunti](https://www.linkedin.com/in/bhagesh-hunakunti/)