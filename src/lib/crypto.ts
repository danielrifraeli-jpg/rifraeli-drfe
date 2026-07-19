/**
 * Client-Side End-to-End Encryption (E2EE) Module
 * Uses standard browser Web Crypto API (AES-GCM 256-bit and PBKDF2)
 */

// Helper to convert ArrayBuffer to Hex string
function bufToHex(buffer: ArrayBuffer): string {
  const byteArray = new Uint8Array(buffer);
  let hexString = "";
  for (let i = 0; i < byteArray.length; i++) {
    const hex = byteArray[i].toString(16).padStart(2, "0");
    hexString += hex;
  }
  return hexString;
}

// Helper to convert Hex string to Uint8Array
function hexToBuf(hexString: string): Uint8Array {
  const len = hexString.length;
  const bytes = new Uint8Array(len / 2);
  for (let i = 0; i < len; i += 2) {
    bytes[i / 2] = parseInt(hexString.substring(i, i + 2), 16);
  }
  return bytes;
}

// Helper to derive a 256-bit AES-GCM key from a password string and salt using PBKDF2
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(password);

  // Import the password as a raw key
  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    passwordBytes,
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  // Derive the AES-GCM 256 key
  return await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts an object into an AES-GCM encrypted string.
 * The output format is: salt_hex:iv_hex:ciphertext_hex
 */
export async function encryptData(data: object, password: string): Promise<string> {
  const encoder = new TextEncoder();
  const plaintext = encoder.encode(JSON.stringify(data));

  // Generate random 16-byte salt and 12-byte initialization vector (IV)
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // Derive key from password and salt
  const key = await deriveKey(password, salt);

  // Encrypt the data using AES-GCM
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    plaintext
  );

  const saltHex = bufToHex(salt);
  const ivHex = bufToHex(iv);
  const ciphertextHex = bufToHex(ciphertextBuffer);

  // Combine into a single transportable string
  return `${saltHex}:${ivHex}:${ciphertextHex}`;
}

/**
 * Decrypts a hex string (salt:iv:ciphertext) using the password.
 * Returns the parsed object or null if decryption fails (e.g., incorrect password).
 */
export async function decryptData(encryptedStr: string, password: string): Promise<any | null> {
  try {
    if (!encryptedStr || !encryptedStr.includes(":")) {
      return null;
    }

    const parts = encryptedStr.split(":");
    if (parts.length !== 3) {
      return null;
    }

    const [saltHex, ivHex, ciphertextHex] = parts;
    const salt = hexToBuf(saltHex);
    const iv = hexToBuf(ivHex);
    const ciphertext = hexToBuf(ciphertextHex);

    // Derive key using the same salt and password
    const key = await deriveKey(password, salt);

    // Decrypt using AES-GCM
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      ciphertext
    );

    const decoder = new TextDecoder();
    const decryptedText = decoder.decode(decryptedBuffer);

    return JSON.parse(decryptedText);
  } catch (err) {
    console.error("Erro na decodificação/descriptografia. Senha incorreta ou dados corrompidos.");
    return null; // Decryption failed
  }
}

/**
 * Helper to compute SHA-256 hash of a string (used for secure, client-side authentication hashing)
 */
export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgBuffer);
  return bufToHex(hashBuffer);
}
