
import React from 'react';
import type { SimulationStep } from '../types';
import { ClipboardDocumentListIcon, ArrowPathIcon, ClockIcon } from './icons';

interface ControlsProps {
  step: SimulationStep;
  onInitialize: () => void;
  onShareKeys: () => void;
  onGenerateSecret: () => void;
  onReset: () => void;
  onNavigateToLogs: () => void;
  onRefreshKeys: () => void;
}

const StepButton: React.FC<{ onClick: () => void; disabled: boolean; children: React.ReactNode; stepNumber: number; isActive: boolean }> = 
({ onClick, disabled, children, stepNumber, isActive }) => {
    const baseClasses = "flex-1 text-left flex items-center space-x-4 p-4 rounded-lg transition-all duration-300 transform";
    const activeClasses = isActive ? "bg-cyan-600 text-white shadow-lg scale-105" : "bg-slate-700/50";
    const disabledClasses = "opacity-50 cursor-not-allowed";
    
    return (
        <button onClick={onClick} disabled={disabled} className={`${baseClasses} ${activeClasses} ${disabled ? disabledClasses : 'hover:bg-cyan-500'}`}>
            <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center font-bold text-lg ${isActive ? 'bg-white text-cyan-700' : 'bg-slate-600 text-slate-200'}`}>
                {stepNumber}
            </div>
            <div>
                {children}
            </div>
        </button>
    );
};


export const Controls: React.FC<ControlsProps> = ({ step, onInitialize, onShareKeys, onGenerateSecret, onReset, onNavigateToLogs, onRefreshKeys }) => {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <h3 className="text-xl font-semibold">Simulation Steps</h3>
             <div className="flex items-center gap-2">
                <button
                    onClick={onRefreshKeys}
                    disabled={step !== 'secret_derived'}
                    className="flex items-center space-x-2 bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ClockIcon className="h-5 w-5"/>
                    <span>Refresh Session</span>
                </button>
                <button
                    onClick={onNavigateToLogs}
                    className="flex items-center space-x-2 bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                    <ClipboardDocumentListIcon className="h-5 w-5"/>
                    <span>View Logs</span>
                </button>
                <button
                    onClick={onReset}
                    className="flex items-center space-x-2 bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                    <ArrowPathIcon className="h-5 w-5"/>
                    <span>Reset Simulation</span>
                </button>
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StepButton onClick={onInitialize} disabled={step !== 'initial'} stepNumber={1} isActive={step === 'initial'}>
                <p className="font-bold">Initialize</p>
                <p className="text-sm opacity-80">Generate IDs & Keys</p>
            </StepButton>
            <StepButton onClick={onShareKeys} disabled={step !== 'initialized'} stepNumber={2} isActive={step === 'initialized'}>
                 <p className="font-bold">Mutual Authentication</p>
                 <p className="text-sm opacity-80">Exchange Public Keys</p>
            </StepButton>
            <StepButton onClick={onGenerateSecret} disabled={step !== 'keys_exchanged'} stepNumber={3} isActive={step === 'keys_exchanged'}>
                <p className="font-bold">Key Agreement</p>
                <p className="text-sm opacity-80">Derive Shared Secret</p>
            </StepButton>
        </div>
    </div>
  );
};
