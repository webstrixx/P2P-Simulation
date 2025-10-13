
import React, { useState, useCallback, useRef } from 'react';
import { PeerPanel } from './components/PeerPanel';
import { Header } from './components/Header';
import { Controls } from './components/Controls';
import type { PeerState, LogEntry, Message, SimulationStep } from './types';
import { 
  generateEccKeyPair, 
  exportKeyToJwk, 
  importJwkToPublicKey, 
  deriveSharedSecret, 
  encryptMessage, 
  decryptMessage 
} from './services/cryptoService';
import { ArrowRightLeftIcon } from './components/icons';
import { LogsPage } from './components/LogsPage';

const initialState: PeerState = {
  pseudoId: '',
  keyPair: null,
  publicKeyJwk: null,
  receivedPublicKeyJwk: null,
  sharedSecret: null,
  messages: [],
};

// FIX: Add a browser-compatible function to convert ArrayBuffer to hex string,
// because `Buffer` is not available in the browser.
const bufferToHex = (buffer: ArrayBuffer) => {
  return [...new Uint8Array(buffer)]
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
};

const App: React.FC = () => {
  const [peerA, setPeerA] = useState<PeerState>({ ...initialState });
  const [peerB, setPeerB] = useState<PeerState>({ ...initialState });
  const [step, setStep] = useState<SimulationStep>('initial');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [view, setView] = useState<'simulation' | 'logs'>('simulation');
  const messageCounter = useRef(0);

  const addLog = useCallback((message: string, type: 'info' | 'success' | 'error' | 'system' = 'info') => {
    setLogs(prev => [...prev, { timestamp: new Date(), message, type }]);
  }, []);

  const handleReset = () => {
    setPeerA({ ...initialState });
    setPeerB({ ...initialState });
    setStep('initial');
    setLogs([]);
    messageCounter.current = 0;
    setView('simulation');
  };

  const handleInitialize = async () => {
    handleReset();
    addLog('Simulation started. Initializing peers...', 'system');
    try {
      const [keyPairA, keyPairB] = await Promise.all([generateEccKeyPair(), generateEccKeyPair()]);
      const [jwkA, jwkB] = await Promise.all([exportKeyToJwk(keyPairA.publicKey), exportKeyToJwk(keyPairB.publicKey)]);
      
      setPeerA(prev => ({ ...prev, pseudoId: `Peer_A_${Math.random().toString(36).substring(2, 8)}`, keyPair: keyPairA, publicKeyJwk: jwkA }));
      setPeerB(prev => ({ ...prev, pseudoId: `Peer_B_${Math.random().toString(36).substring(2, 8)}`, keyPair: keyPairB, publicKeyJwk: jwkB }));
      
      addLog('Peer A generated pseudo-ID and ECC key pair.', 'success');
      addLog('Peer B generated pseudo-ID and ECC key pair.', 'success');
      setStep('initialized');
    } catch (error) {
      addLog(`Error during initialization: ${(error as Error).message}`, 'error');
    }
  };
  
  const handleShareKeys = () => {
    if (!peerA.publicKeyJwk || !peerB.publicKeyJwk) return;
    addLog('Starting mutual authentication: Peers are exchanging public keys.', 'system');
    
    setPeerA(prev => ({ ...prev, receivedPublicKeyJwk: peerB.publicKeyJwk }));
    setPeerB(prev => ({ ...prev, receivedPublicKeyJwk: peerA.publicKeyJwk }));
    
    addLog('Peer A received public key from Peer B.', 'info');
    addLog('Peer B received public key from Peer A.', 'info');
    setStep('keys_exchanged');
  };

  const handleGenerateSecret = async () => {
    if (!peerA.keyPair || !peerB.keyPair || !peerA.receivedPublicKeyJwk || !peerB.receivedPublicKeyJwk) return;
    addLog('Starting secure key agreement using ECDH.', 'system');

    try {
      const importedPublicKeyForA = await importJwkToPublicKey(peerA.receivedPublicKeyJwk);
      const importedPublicKeyForB = await importJwkToPublicKey(peerB.receivedPublicKeyJwk);

      const [secretA, secretB] = await Promise.all([
        deriveSharedSecret(peerA.keyPair.privateKey, importedPublicKeyForA),
        deriveSharedSecret(peerB.keyPair.privateKey, importedPublicKeyForB),
      ]);

      const exportedSecretA = await window.crypto.subtle.exportKey('raw', secretA);
      const exportedSecretB = await window.crypto.subtle.exportKey('raw', secretB);
      
      const secretA_hex = bufferToHex(exportedSecretA);
      const secretB_hex = bufferToHex(exportedSecretB);

      if (secretA_hex !== secretB_hex) {
        throw new Error("Derived secrets do not match!");
      }

      setPeerA(prev => ({...prev, sharedSecret: secretA}));
      setPeerB(prev => ({...prev, sharedSecret: secretB}));

      addLog('Peer A derived shared secret.', 'success');
      addLog('Peer B derived shared secret.', 'success');
      addLog('Shared secrets match! Secure channel established.', 'success');
      setStep('secret_derived');

    } catch (error) {
       addLog(`Error deriving shared secret: ${(error as Error).message}`, 'error');
    }
  };

  const handleRefreshKeys = async () => {
    if (step !== 'secret_derived') return;

    addLog('Starting periodic session key refresh...', 'system');

    try {
        const [newKeyPairA, newKeyPairB] = await Promise.all([generateEccKeyPair(), generateEccKeyPair()]);
        const [newJwkA, newJwkB] = await Promise.all([exportKeyToJwk(newKeyPairA.publicKey), exportKeyToJwk(newKeyPairB.publicKey)]);
        const newPseudoIdA = `Peer_A_${Math.random().toString(36).substring(2, 8)}`;
        const newPseudoIdB = `Peer_B_${Math.random().toString(36).substring(2, 8)}`;

        addLog('Peer A generated a new anonymous identity and ECC key pair.', 'info');
        addLog('Peer B generated a new anonymous identity and ECC key pair.', 'info');

        addLog('Exchanging new public keys for mutual authentication.', 'system');
        const receivedKeyForA = newJwkB;
        const receivedKeyForB = newJwkA;
        
        addLog('Deriving new shared secrets using ECDH.', 'system');
        const importedPublicKeyForA = await importJwkToPublicKey(receivedKeyForA);
        const importedPublicKeyForB = await importJwkToPublicKey(receivedKeyForB);

        const [newSecretA, newSecretB] = await Promise.all([
            deriveSharedSecret(newKeyPairA.privateKey, importedPublicKeyForA),
            deriveSharedSecret(newKeyPairB.privateKey, importedPublicKeyForB),
        ]);

        const exportedSecretA = await window.crypto.subtle.exportKey('raw', newSecretA);
        const exportedSecretB = await window.crypto.subtle.exportKey('raw', newSecretB);
      
        if (bufferToHex(exportedSecretA) !== bufferToHex(exportedSecretB)) {
            throw new Error("Derived secrets for the new session do not match!");
        }

        setPeerA(prev => ({ 
            ...prev,
            pseudoId: newPseudoIdA,
            keyPair: newKeyPairA,
            publicKeyJwk: newJwkA,
            receivedPublicKeyJwk: receivedKeyForA,
            sharedSecret: newSecretA,
        }));
        setPeerB(prev => ({
            ...prev,
            pseudoId: newPseudoIdB,
            keyPair: newKeyPairB,
            publicKeyJwk: newJwkB,
            receivedPublicKeyJwk: receivedKeyForB,
            sharedSecret: newSecretB,
        }));

        addLog('New shared secrets match! Session key successfully refreshed.', 'success');
        
    } catch (error) {
        addLog(`Error during key refresh: ${(error as Error).message}`, 'error');
    }
  };

  const handleSendMessage = async (sender: 'A' | 'B', content: string) => {
    const senderPeer = sender === 'A' ? peerA : peerB;
    const receiverPeer = sender === 'A' ? peerB : peerA;

    if (!senderPeer.sharedSecret || !receiverPeer.sharedSecret) {
      addLog('Cannot send message: Shared secret not established.', 'error');
      return;
    }
    
    messageCounter.current++;
    const messageId = messageCounter.current;
    
    addLog(`Peer ${sender} is encrypting message: "${content}"`, 'info');
    const { ciphertext, iv } = await encryptMessage(senderPeer.sharedSecret, content);
    
    addLog(`Message encrypted. Transmitting to Peer ${sender === 'A' ? 'B' : 'A'}.`, 'system');

    const decryptedContent = await decryptMessage(receiverPeer.sharedSecret, { ciphertext, iv });
    addLog(`Peer ${sender === 'A' ? 'B' : 'A'} received and decrypted message.`, 'success');
    
    const newMessage: Message = {
      id: messageId,
      sender: senderPeer.pseudoId,
      content,
      ciphertext,
      iv,
      decryptedContent,
      timestamp: new Date(),
    };

    setPeerA(p => ({ ...p, messages: [...p.messages, newMessage] }));
    setPeerB(p => ({ ...p, messages: [...p.messages, newMessage] }));
  };


  return (
    <div className="min-h-screen font-sans antialiased">
      <main>
        {view === 'simulation' ? (
          <div className="container mx-auto p-4 md:p-8">
            <Header />
            <Controls
              step={step}
              onInitialize={handleInitialize}
              onShareKeys={handleShareKeys}
              onGenerateSecret={handleGenerateSecret}
              onReset={handleReset}
              onNavigateToLogs={() => setView('logs')}
              onRefreshKeys={handleRefreshKeys}
            />
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-start relative">
              <PeerPanel name="Peer A" state={peerA} onSendMessage={(content) => handleSendMessage('A', content)} isChannelSecure={step === 'secret_derived'} />
              
              <div className="absolute hidden md:flex top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 justify-center items-center h-full">
                  <ArrowRightLeftIcon className="h-12 w-12 text-slate-500" />
              </div>

              <PeerPanel name="Peer B" state={peerB} onSendMessage={(content) => handleSendMessage('B', content)} isChannelSecure={step === 'secret_derived'} />
            </div>
          </div>
        ) : (
          <LogsPage
            logs={logs}
            onNavigateBack={() => setView('simulation')}
          />
        )}
      </main>
    </div>
  );
};

export default App;
