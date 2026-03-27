import { useEffect, useState } from 'react';
import { Cpu, Monitor, HardDrive, Server } from 'lucide-react';

interface HardwareStats {
  cpuLoad: number;
  memUsed: number;
  memTotal: number;
  gpus: Array<{
    model: string;
    vram: number | null;
    utilization: number | null;
  }>;
}

export function HardwareMonitor() {
  const [stats, setStats] = useState<HardwareStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/hardware');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (e) {
        // Ignore if endpoint missing
      }
    };
    
    fetchStats();
    const interval = setInterval(fetchStats, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!stats) {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    return (
      <div className="flex items-center space-x-2 text-[10px] font-mono bg-slate-100/50 dark:bg-slate-800/50 px-3 py-1.5 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 uppercase tracking-widest cursor-help group relative" title="Hardware monitoring requires a local agent.">
        <Server size={12} className="opacity-50" />
        <span>HARDWARE: {isLocal ? 'OFFLINE' : 'LOCAL ONLY'}</span>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-slate-900 text-white text-[9px] normal-case rounded shadow-xl z-50 pointer-events-none border border-slate-700">
          Hardware monitoring requires the Textorcist agent to be running locally. In hosted environments, this feature is disabled for privacy and security.
        </div>
      </div>
    );
  }

  const memPercent = Math.round((stats.memUsed / stats.memTotal) * 100);
  const cpuPercent = Math.round(stats.cpuLoad);

  const getColorClass = (percent: number) => {
    if (percent > 90) return 'text-red-600 dark:text-red-400';
    if (percent > 50) return 'text-amber-600 dark:text-amber-500';
    return 'text-emerald-600 dark:text-emerald-400';
  };

  const getIconColorClass = (percent: number) => {
    if (percent > 90) return 'text-red-500';
    if (percent > 50) return 'text-amber-500';
    return 'text-emerald-500';
  };

  return (
    <div className="flex items-center space-x-4 text-xs font-mono bg-slate-50 dark:bg-slate-800 px-3 py-1.5 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-300 shrink-0">
        <Server size={14} className={getIconColorClass(memPercent)} />
        <span className="font-semibold text-slate-900 dark:text-slate-100">
          RAM: <span className={getColorClass(memPercent)}>{Math.round(stats.memUsed / (1024*1024*1024))}GB / {Math.round(stats.memTotal / (1024*1024*1024))}GB ({memPercent}%)</span>
        </span>
      </div>
      <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-300">
        <Cpu size={14} className={getIconColorClass(cpuPercent)} />
        <span className="font-semibold text-slate-900 dark:text-slate-100">
          CPU: <span className={getColorClass(cpuPercent)}>{cpuPercent}%</span>
        </span>
      </div>
      {stats.gpus.map((gpu, i) => {
        const utilPercent = Math.round(gpu.utilization || 0);
        const name = gpu.model.includes('Intel') || gpu.model.includes('NPU') ? 'NPU' : 'GPU';
        return (
          <div key={i} className="flex items-center space-x-3 border-l border-slate-300 dark:border-slate-600 pl-3">
            <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-300" title={gpu.model}>
              <Monitor size={14} className={getIconColorClass(utilPercent)} />
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {name}: <span className={getColorClass(utilPercent)}>{gpu.utilization != null ? `${utilPercent}%` : 'ON'}</span>
              </span>
            </div>
            {gpu.vram != null && gpu.vram > 0 && (
              <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-300">
                <HardDrive size={14} className="text-emerald-500" />
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  VRAM: <span className="text-emerald-600 dark:text-emerald-400">{Math.round(gpu.vram / 1024)}GB</span>
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
