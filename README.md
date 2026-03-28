<p align="center">
  <img src="public/branding.svg" width="400" alt="TEXTORCIST OCR Logo" />
</p>

# Textorcist

Textorcist is a modern, API-first client-side OCR web application designed to extract and format handwritten text from images. Developed with React, TypeScript, and Vite, it offers an entirely local, browser-based experience without relying on a back-end server for data processing or file storage.

## Features

- **Multiple OCR Providers Supported**:
  - **Ollama**: Connect to a local or remote Ollama instance (defaults to `http://localhost:11434`) for completely private, GPU-accelerated OCR. Auto-discovers installed models and supports CPU/GPU/NPU hardware acceleration selection.
  - **OpenRouter**: Use high-powered cloud vision models (Gemini Pro, Qwen VL Plus, etc.) with your API key.
  - **HuggingFace**: Use any custom HF inference endpoint as a provider.
  - **Google**: Connect directly to Google AI (Gemini) vision models with your API key.
  - **Custom API**: Point to any OpenAI-compatible vision endpoint.

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

## Docker

Textorcist ships with a multi-stage `Dockerfile` (Node.js build → Nginx serve). The container serves the static frontend; Ollama runs natively on your host and is called directly from the browser — so **GPU inference is always performed by your host's hardware**, not inside the container.

### Quick Start

```bash
# 1. Start Ollama on your host (with GPU support)
ollama serve

# 2. Pull a vision model (first time only)
ollama pull deepseek-ocr:3b
# or: ollama pull llama3.2-vision

# 3. Build and start Textorcist
docker compose up --build -d

# 4. Open the app
start http://localhost:8080
```

### Managing the Container

```bash
# Check container status
docker compose ps

# View container logs
docker compose logs -f textorcist

# Stop the container
docker compose down

# Rebuild after code changes
docker compose up --build -d
```

### GPU Verification

Before running, confirm Docker can see your GPU:

```bash
# Verify NVIDIA GPU is accessible from Docker
docker run --rm --gpus all nvidia/cuda:11.8.0-base-ubuntu22.04 nvidia-smi
```

Expected output shows your GPU (e.g., `NVIDIA GeForce RTX 4060`) and the NVIDIA driver version. If this fails, install [nvidia-container-toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html) (Linux) or enable WSL2 GPU passthrough (Windows).

### How Ollama + GPU Works in Docker

The Textorcist container runs **only Nginx** — it has no Python or Node.js runtime. When you click "Extract Text", your browser sends the image **directly** to `http://localhost:11434` (Ollama on your host). This means:

- ✅ Ollama uses your host GPU at full speed — zero container overhead
- ✅ No CORS issues (both app and Ollama are on `localhost`)
- ✅ No need to pass GPU devices into the container for OCR
- ℹ️ The `deploy.resources.reservations` block in `docker-compose.yml` is present for future use if a backend service is added

#### GPU acceleration (NVIDIA)
The `docker-compose.yml` is already configured to expose NVIDIA GPUs to the container. Ensure you have the `nvidia-container-toolkit` installed on your host machine (or WSL2 GPU passthrough configured) to utilize GPU acceleration.

## Deployment (Render.com)

Textorcist is a static frontend. You can easily deploy it on [Render](https://render.com/) or any other static site host (Vercel, Netlify, Cloudflare Pages).

### Deploying to Render
1. Create a new **Static Site** on Render.
2. Connect your GitHub repository.
3. Set the **Build Command** to: `npm install && npm run build`
4. Set the **Publish Directory** to: `dist`
5. Click **Deploy**.

*Note: All dependencies are managed via `package.json` — no extra runtime is needed on Render.*

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

## Hosted vs. Local Execution

When running Textorcist on a hosted platform (like Render, Vercel, or Netlify), certain local features require additional configuration due to browser security policies:

### 1. Ollama Connectivity (Mixed Content)
Hosted sites use **HTTPS**, but local Ollama usually runs on **HTTP**. Browsers block this by default ("Mixed Content").

#### Solution A: Secure Tunneling (Recommended)
Use **ngrok** to create a secure HTTPS bridge to your local machine:
1.  **Authorize**: `ngrok config add-authtoken <YOUR_TOKEN>`
2.  **Start Tunnel**: `ngrok http 11434 --host-header=localhost`
3.  **Use URL**: Copy the dynamic HTTPS URL (e.g., `https://...ngrok-free.dev`) and paste it into Textorcist Settings under **Ollama Base URL**.

*Alternative (No signup)*:
`npx localtunnel --port 11434`

#### Solution B: Browser Security Override
Set `OLLAMA_ORIGINS="*"` on your local machine and allow "Insecure Content" for the Textorcist domain in your browser site settings (Click the lock icon in the URL bar > Site Settings > Insecure Content > Allow).

### 2. Hardware Monitoring
The Hardware Monitor (CPU %, RAM, GPU %) requires the Vite dev server's `systeminformation` middleware to be running.
- **Docker / Hosted**: Displays `SYSTEM: STANDBY` — hardware metrics are disabled for privacy and because Nginx does not run Node.js.
- **Local dev**: Works automatically when running `npm run dev`. Stats refresh every 2 seconds.

## Requirements

- Node.js version 18+ 
- A modern web browser
- (Optional) Ollama installed locally for local execution
- (Optional) OpenRouter or HuggingFace API key for cloud execution

## Author

[Bhagesh Hunakunti](https://www.linkedin.com/in/bhagesh-hunakunti/)