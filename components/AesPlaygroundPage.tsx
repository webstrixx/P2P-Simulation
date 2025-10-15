import React, { useState, useEffect } from 'react';
import { ArrowUturnLeftIcon, LockClosedIcon, ShieldCheckIcon } from './icons';
import { encryptMessage, decryptMessage, ENCRYPTION_ALGORITHM } from '../services/cryptoService';
import { Message } from '../types';

interface AesPlaygroundPageProps {
  sharedSecret: CryptoKey | null;
  onNavigateBack: () => void;
  simulationMessages: Message[];
}

const bufferToHex = (buffer: ArrayBuffer | Uint8Array): string => {
  const u8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return [...u8].map(b => b.toString(16).padStart(2, '0')).join('');
};

const ValueDisplay: React.FC<{ label: string; value: string | null; color?: string }> = ({ label, value, color = 'text-cyan-400' }) => (
    <div>
        <h3 className="text-sm font-semibold text-slate-400">{label}</h3>
        <pre className={`mt-1 p-3 bg-slate-800 rounded-lg text-xs font-mono break-all whitespace-pre-wrap ${value ? color : 'text-slate-500'}`}>
            {value || 'N/A'}
        </pre>
    </div>
);


export const AesPlaygroundPage: React.FC<AesPlaygroundPageProps> = ({ sharedSecret, onNavigateBack, simulationMessages }) => {
    const [plaintext, setPlaintext] = useState('This is a secret message.');
    const [iv, setIv] = useState<Uint8Array | null>(null);
    const [ciphertext, setCiphertext] = useState<ArrayBuffer | null>(null);
    const [decryptedText, setDecryptedText] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        // Reset state if the component is re-mounted or the shared secret disappears
        if (!sharedSecret) {
            setIv(null);
            setCiphertext(null);
            setDecryptedText(null);
            setError('Shared secret is not available. Please complete the key agreement in the simulation.');
        } else {
             setError(null);
        }
    }, [sharedSecret]);

    const handleSelectMessage = (message: Message) => {
        setPlaintext(message.decryptedContent);
        setIv(message.iv);
        setCiphertext(message.ciphertext);
        setDecryptedText(message.decryptedContent);
        setError(null);
    };

    const handleEncrypt = async () => {
        if (!sharedSecret || !plaintext) return;
        setIsProcessing(true);
        setError(null);
        setDecryptedText(null);
        setCiphertext(null);
        setIv(null);
        try {
            const { ciphertext: ct, iv: newIv } = await encryptMessage(sharedSecret, plaintext);
            setCiphertext(ct);
            setIv(newIv);
        } catch (e) {
            setError(`Encryption failed: ${(e as Error).message}`);
        }
        setIsProcessing(false);
    };
    
    const handleDecrypt = async () => {
        if (!sharedSecret || !ciphertext || !iv) return;
        setIsProcessing(true);
        setError(null);
        try {
            const dt = await decryptMessage(sharedSecret, { ciphertext, iv });
            setDecryptedText(dt);
        } catch (e) {
            setError(`Decryption failed: ${(e as Error).message}. This can happen if the key or IV is incorrect.`);
        }
        setIsProcessing(false);
    };

    const isEncryptDisabled = !sharedSecret || !plaintext.trim() || isProcessing;
    const isDecryptDisabled = !sharedSecret || !ciphertext || !iv || isProcessing;

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="flex justify-between items-center mb-6">
                 <h1 className="text-3xl font-bold text-slate-300">AES-GCM Encryption Playground</h1>
                 <button
                    onClick={onNavigateBack}
                    className="flex items-center space-x-2 bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                    <ArrowUturnLeftIcon className="h-5 w-5"/>
                    <span>Back to Simulation</span>
                </button>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl shadow-lg p-6">
                {!sharedSecret ? (
                     <div className="text-center py-12">
                        <ShieldCheckIcon className="h-16 w-16 text-amber-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-amber-500">Shared Secret Not Available</h2>
                        <p className="text-slate-400 mt-2">Please go back to the simulation and complete all steps to derive the shared secret.</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="md:col-span-2">
                             <div className="grid md:grid-cols-2 gap-8">
                                {/* INPUT & CONTROLS */}
                                <div className="space-y-6">
                                    <div>
                                        <label htmlFor="plaintext" className="block text-sm font-medium text-slate-300 mb-2">
                                            Plaintext Message
                                        </label>
                                        <textarea
                                            id="plaintext"
                                            rows={4}
                                            value={plaintext}
                                            onChange={(e) => setPlaintext(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
                                            placeholder="Enter the message you want to encrypt..."
                                        />
                                    </div>
                                    <div className="flex items-center space-x-3 p-3 bg-slate-700/50 rounded-lg">
                                        <LockClosedIcon className="h-8 w-8 text-green-400 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium text-slate-400">ECDH Shared Secret (Key)</p>
                                            <p className="text-xs text-green-400">Available from simulation for encryption.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <button onClick={handleEncrypt} disabled={isEncryptDisabled} className="flex-1 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors">
                                            {isProcessing ? 'Processing...' : 'Encrypt'}
                                        </button>
                                        <button onClick={handleDecrypt} disabled={isDecryptDisabled} className="flex-1 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors">
                                            {isProcessing ? 'Processing...' : 'Decrypt'}
                                        </button>
                                    </div>
                                </div>

                                {/* OUTPUT & RESULTS */}
                                <div className="space-y-4">
                                    <h2 className="text-xl font-semibold text-slate-300">Process & Results</h2>
                                    <ValueDisplay label={`Initialization Vector (IV - 12 bytes)`} value={iv ? bufferToHex(iv) : null} />
                                    <ValueDisplay label={`Ciphertext (Encrypted Data, using ${ENCRYPTION_ALGORITHM})`} value={ciphertext ? bufferToHex(ciphertext) : null} />
                                    <ValueDisplay label="Decrypted Message" value={decryptedText} color="text-green-400" />
                                    {error && (
                                        <div className="p-3 bg-red-900/50 border border-red-700 text-red-300 rounded-lg text-sm">
                                            <strong>Error:</strong> {error}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        {/* SIMULATION MESSAGES */}
                        <div className="md:col-span-1">
                             <h2 className="text-xl font-semibold text-slate-300 mb-4">Simulation Messages</h2>
                             <div className="bg-slate-900/70 rounded-lg p-2 h-[28rem] overflow-y-auto space-y-2">
                                {simulationMessages.length === 0 ? (
                                    <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                                        No messages sent in the simulation yet.
                                    </div>
                                ) : (
                                    simulationMessages.map((msg) => (
                                    <button
                                        key={msg.id}
                                        onClick={() => handleSelectMessage(msg)}
                                        className="w-full text-left p-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    >
                                        <p className="text-xs font-semibold text-cyan-400 truncate" title={msg.sender}>
                                            From: {msg.sender.split('_')[1]}
                                        </p>
                                        <p className="text-sm break-words mt-1">{msg.content}</p>
                                    </button>
                                    ))
                                )}
                             </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};