import React, { useState } from 'react';
import type { PeerState, Message } from '../types';
import { KeyIcon, UserCircleIcon, LockClosedIcon, PaperAirplaneIcon, ShieldCheckIcon } from './icons';

interface PeerPanelProps {
  name: string;
  state: PeerState;
  onSendMessage: (content: string) => void;
  isChannelSecure: boolean;
}

const formatKey = (key: any) => {
  if (!key) return <span className="text-slate-500">Not generated</span>;
  const str = JSON.stringify(key);
  return str.length > 30 ? `${str.substring(0, 15)}...${str.substring(str.length - 15)}` : str;
};

const bufferToHex = (buffer: ArrayBuffer) => {
  return [...new Uint8Array(buffer)]
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
};

const ChatMessage: React.FC<{ message: Message; isOwn: boolean; myId: string }> = ({ message, isOwn, myId }) => {
    const isSender = message.sender === myId;
    const [showCiphertext, setShowCiphertext] = useState(false);

    return (
        <div className={`flex flex-col ${isSender ? 'items-end' : 'items-start'} mb-4`}>
            <div className={`max-w-xs lg:max-w-md p-3 rounded-lg ${isSender ? 'bg-cyan-700 text-white' : 'bg-slate-700'}`}>
                <p className="text-sm font-bold mb-1">{isSender ? 'You' : message.sender}</p>
                <p className="text-base break-words">{message.decryptedContent}</p>
                <button
                    onClick={() => setShowCiphertext(!showCiphertext)}
                    className="text-xs mt-2 opacity-70 hover:opacity-100 transition-opacity"
                >
                    {showCiphertext ? 'Hide' : 'Show'} Encrypted Data
                </button>
                {showCiphertext && (
                    <div className="mt-2 p-2 bg-slate-800/50 rounded text-xs break-all font-mono">
                        <p><strong className="text-cyan-400">IV:</strong> {bufferToHex(message.iv.buffer)}</p>
                        <p className="mt-1"><strong className="text-cyan-400">Ciphertext:</strong> {bufferToHex(message.ciphertext)}</p>
                    </div>
                )}
                <p className="text-right text-xs mt-1 opacity-60">{new Date(message.timestamp).toLocaleTimeString()}</p>
            </div>
        </div>
    );
};

export const PeerPanel: React.FC<PeerPanelProps> = ({ name, state, onSendMessage, isChannelSecure }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && isChannelSecure) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl shadow-lg p-6 flex flex-col space-y-6">
      <h2 className="text-2xl font-bold text-cyan-400">{name}</h2>
      
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <UserCircleIcon className="h-6 w-6 text-slate-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-400">Pseudo Identity</p>
            <p className="text-sm font-mono break-all">{state.pseudoId || <span className="text-slate-500">Not generated</span>}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <KeyIcon className="h-6 w-6 text-slate-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-400">ECC Public Key</p>
            <p className="text-xs font-mono break-all">{formatKey(state.publicKeyJwk)}</p>
          </div>
        </div>
         <div className="flex items-center space-x-3">
          <KeyIcon className="h-6 w-6 text-slate-400 opacity-50" />
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-400">Received Public Key</p>
            <p className="text-xs font-mono break-all">{formatKey(state.receivedPublicKeyJwk)}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <LockClosedIcon className="h-6 w-6 text-green-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-400">ECDH Shared Secret</p>
            <p className="text-xs font-mono break-all">{state.sharedSecret ? <span className="text-green-400">Successfully Derived & Secured</span> : <span className="text-slate-500">Not derived</span>}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <ShieldCheckIcon className="h-6 w-6 text-cyan-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-400">Encryption Algorithm</p>
            <p className="text-sm font-mono break-all">{state.encryptionAlgorithm ? <span className="text-cyan-400">{state.encryptionAlgorithm}</span> : <span className="text-slate-500">N/A</span>}</p>
          </div>
        </div>
      </div>
      
      <div className="flex-grow flex flex-col bg-slate-900/70 rounded-lg p-4 h-96">
        <div className="flex-grow overflow-y-auto pr-2">
            {state.messages.length === 0 && (
                <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                    {isChannelSecure ? "Messages will appear here" : "Establish secure channel to chat"}
                </div>
            )}
            {state.messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} isOwn={msg.sender === state.pseudoId} myId={state.pseudoId} />
            ))}
        </div>
        <form onSubmit={handleSubmit} className="mt-4 flex items-center space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={isChannelSecure ? 'Type a secure message...' : 'Channel not secure'}
            disabled={!isChannelSecure}
            className="flex-1 bg-slate-800 border border-slate-600 rounded-full py-2 px-4 focus:ring-2 focus:ring-cyan-500 focus:outline-none disabled:opacity-50 transition"
          />
          <button type="submit" disabled={!isChannelSecure || !message.trim()} className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-full p-2.5 transition-colors">
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </form>
         {!isChannelSecure && (
            <p className="text-xs text-center text-amber-500 mt-2">Complete all steps to enable secure communication.</p>
        )}
        {isChannelSecure && (
            <div className="flex items-center justify-center text-xs text-green-400 mt-2">
                <ShieldCheckIcon className="h-4 w-4 mr-1"/>
                <span>End-to-end encrypted communication is active.</span>
            </div>
        )}
      </div>
    </div>
  );
};
