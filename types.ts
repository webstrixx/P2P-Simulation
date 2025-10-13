
export type SimulationStep = 'initial' | 'initialized' | 'keys_exchanged' | 'secret_derived';

export interface Message {
  id: number;
  sender: string;
  content: string;
  ciphertext: ArrayBuffer;
  iv: Uint8Array;
  decryptedContent: string;
  timestamp: Date;
}

export interface PeerState {
  pseudoId: string;
  keyPair: CryptoKeyPair | null;
  publicKeyJwk: JsonWebKey | null;
  receivedPublicKeyJwk: JsonWebKey | null;
  sharedSecret: CryptoKey | null;
  messages: Message[];
}

export interface LogEntry {
  timestamp: Date;
  message: string;
  type: 'info' | 'success' | 'error' | 'system';
}
