import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import si from 'systeminformation'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'hardware-monitor',
      configureServer(server) {
        server.middlewares.use('/api/hardware', async (req, res, next) => {
          if (req.url === '/') {
            try {
              const cpu = await si.currentLoad();
              const mem = await si.mem();
              const graphics = await si.graphics();
              
              let gpuList = graphics.controllers;
              // If there are multiple GPUs, try to hide the integrated shared ones (Intel UHD, AMD Radeon Graphics)
              if (gpuList.length > 1) {
                const dedicated = gpuList.filter((g: any) => !g.model.toLowerCase().includes('uhd') && !g.model.toLowerCase().includes('iris') && !(g.model.toLowerCase().includes('amd radeon') && g.vram < 1024));
                if (dedicated.length > 0) gpuList = dedicated;
              }

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                cpuLoad: cpu.currentLoad,
                memUsed: mem.active,
                memTotal: mem.total,
                gpus: gpuList.map((g: any) => ({
                  model: g.model || g.name,
                  vram: g.vram,
                  utilization: g.utilizationGpu
                }))
              }));
              return;
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
              return;
            }
          }
          next();
        })
      }
    }
  ],
})
