
const ECC_ALGORITHM = {
  name: 'ECDH',
  namedCurve: 'P-256',
};

const ENCRYPTION_ALGORITHM = 'AES-GCM';
const ENCRYPTION_KEY_LENGTH = 256;

/**
 * Generates an Elliptic Curve Cryptography (ECC) key pair for ECDH.
 */
export const generateEccKeyPair = async (): Promise<CryptoKeyPair> => {
  return await window.crypto.subtle.generateKey(ECC_ALGORITHM, true, ['deriveKey']);
};

/**
 * Exports a CryptoKey to a JSON Web Key (JWK) format for serialization.
 */
export const exportKeyToJwk = async (key: CryptoKey): Promise<JsonWebKey> => {
  return await window.crypto.subtle.exportKey('jwk', key);
};

/**
 * Imports a public key from JWK format into a CryptoKey object.
 */
export const importJwkToPublicKey = async (jwk: JsonWebKey): Promise<CryptoKey> => {
  return await window.crypto.subtle.importKey('jwk', jwk, ECC_ALGORITHM, true, []);
};

/**
 * Derives a shared secret CryptoKey using ECDH.
 */
export const deriveSharedSecret = async (privateKey: CryptoKey, publicKey: CryptoKey): Promise<CryptoKey> => {
  return await window.crypto.subtle.deriveKey(
    { name: 'ECDH', public: publicKey },
    privateKey,
    { name: ENCRYPTION_ALGORITHM, length: ENCRYPTION_KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );
};

/**
 * Encrypts a plaintext message using AES-GCM with the shared secret.
 */
export const encryptMessage = async (secretKey: CryptoKey, plaintext: string): Promise<{ ciphertext: ArrayBuffer; iv: Uint8Array }> => {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encodedMessage = new TextEncoder().encode(plaintext);

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: ENCRYPTION_ALGORITHM, iv: iv },
    secretKey,
    encodedMessage
  );

  return { ciphertext, iv };
};

/**
 * Decrypts a ciphertext using AES-GCM with the shared secret.
 */
export const decryptMessage = async (secretKey: CryptoKey, { ciphertext, iv }: { ciphertext: ArrayBuffer; iv: Uint8Array }): Promise<string> => {
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: ENCRYPTION_ALGORITHM, iv: iv },
    secretKey,
    ciphertext
  );

  return new TextDecoder().decode(decryptedBuffer);
};
