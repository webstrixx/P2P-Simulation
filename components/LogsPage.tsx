
import React from 'react';
import { LogPanel } from './LogPanel';
import type { LogEntry } from '../types';
import { ArrowUturnLeftIcon } from './icons';

interface LogsPageProps {
  logs: LogEntry[];
  onNavigateBack: () => void;
}

export const LogsPage: React.FC<LogsPageProps> = ({ logs, onNavigateBack }) => {
  return (
    <div className="container mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-6">
             <h1 className="text-3xl font-bold text-slate-300">Full Simulation Log</h1>
             <button
                onClick={onNavigateBack}
                className="flex items-center space-x-2 bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
                <ArrowUturnLeftIcon className="h-5 w-5"/>
                <span>Back to Simulation</span>
            </button>
        </div>
      <LogPanel logs={logs} />
    </div>
  );
};
