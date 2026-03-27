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

  if (!stats) return null;

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
