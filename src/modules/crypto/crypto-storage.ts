/**
 * Browser Crypto Storage
 * Encrypts and decrypts sensitive data using Web Crypto API
 * Requires a password/PIN for encryption/decryption
 */

export async function encryptValue(value: string, password: string): Promise<string> {
  try {
    const encoder = new TextEncoder()
    const data = encoder.encode(value)

    // Derive key from password using PBKDF2
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    )

    const derivedKey = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: encoder.encode('nomie-crypto-salt'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      passwordKey,
      256
    )

    const key = await crypto.subtle.importKey(
      'raw',
      derivedKey,
      'AES-GCM',
      false,
      ['encrypt']
    )

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12))

    // Encrypt data
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    )

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength)
    combined.set(iv)
    combined.set(new Uint8Array(encrypted), iv.length)

    // Return as base64 for storage
    return btoa(String.fromCharCode(...combined))
  } catch (error) {
    console.error('Encryption failed:', error)
    throw new Error('Failed to encrypt value')
  }
}

export async function decryptValue(encrypted: string, password: string): Promise<string> {
  try {
    const encoder = new TextEncoder()

    // Decode from base64
    const combined = new Uint8Array(
      atob(encrypted)
        .split('')
        .map(c => c.charCodeAt(0))
    )

    // Extract IV and encrypted data
    const iv = combined.slice(0, 12)
    const encryptedData = combined.slice(12)

    // Derive key from password
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    )

    const derivedKey = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: encoder.encode('nomie-crypto-salt'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      passwordKey,
      256
    )

    const key = await crypto.subtle.importKey(
      'raw',
      derivedKey,
      'AES-GCM',
      false,
      ['decrypt']
    )

    // Decrypt data
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encryptedData
    )

    return new TextDecoder().decode(decrypted)
  } catch (error) {
    console.error('Decryption failed:', error)
    throw new Error('Failed to decrypt value. Incorrect PIN or corrupted data.')
  }
}
