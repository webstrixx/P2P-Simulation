
import React, { useEffect, useRef } from 'react';
import type { LogEntry } from '../types';
import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, CogIcon } from './icons';

const getLogStyle = (type: LogEntry['type']) => {
  switch (type) {
    case 'success':
      return {
        icon: <CheckCircleIcon className="h-5 w-5 text-green-400" />,
        color: 'text-green-400',
      };
    case 'error':
      return {
        icon: <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />,
        color: 'text-red-400',
      };
    case 'system':
        return {
        icon: <CogIcon className="h-5 w-5 text-cyan-400" />,
        color: 'text-cyan-400',
        };
    case 'info':
    default:
      return {
        icon: <InformationCircleIcon className="h-5 w-5 text-slate-400" />,
        color: 'text-slate-300',
      };
  }
};

export const LogPanel: React.FC<{ logs: LogEntry[] }> = ({ logs }) => {
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);
    
  return (
    <div className="mt-8 md:mt-0">
      <div
        ref={logContainerRef}
        className="bg-slate-900/80 border border-slate-700 rounded-lg p-4 h-[70vh] overflow-y-auto font-mono text-sm"
      >
        {logs.map((log, index) => {
          const { icon, color } = getLogStyle(log.type);
          return (
            <div key={index} className={`flex items-start space-x-3 mb-2 ${color}`}>
              <div className="flex-shrink-0 mt-0.5">{icon}</div>
              <div className="flex-1">
                <span className="text-slate-500 mr-2">
                  [{log.timestamp.toLocaleTimeString()}]
                </span>
                <span>{log.message}</span>
              </div>
            </div>
          );
        })}
        {logs.length === 0 && <p className="text-slate-500">Log entries will appear here as the simulation progresses.</p>}
      </div>
    </div>
  );
};
