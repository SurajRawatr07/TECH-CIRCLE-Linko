/**
 * LinkPulse 2.0 — Base62 Shortening Engine
 * 
 * Standard Base62 Alphabet (62 alphanumeric characters):
 * 0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ
 * 
 * ARCHITECTURE NOTICE:
 * Base62 encoding is a compact numeric index representation, NOT encryption
 * or a security mechanism. In this frontend-only phase, codes resolve against
 * locally persisted links within this browser session.
 */

export const BASE62_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const BASE = BigInt(BASE62_ALPHABET.length); // 62n

/**
 * Encodes a numeric value (or BigInt) into a Base62 string.
 */
export function encodeBase62(value: number | bigint): string {
  if (value === 0 || value === 0n) {
    return BASE62_ALPHABET[0];
  }

  let n = typeof value === 'number' ? BigInt(Math.floor(Math.abs(value))) : value;
  if (n < 0n) n = -n;

  let result = '';
  while (n > 0n) {
    const remainder = Number(n % BASE);
    result = BASE62_ALPHABET[remainder] + result;
    n = n / BASE;
  }
  return result;
}

/**
 * Decodes a Base62 string back into a BigInt value.
 */
export function decodeBase62(str: string): bigint {
  if (!str) return 0n;
  let result = 0n;
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const index = BASE62_ALPHABET.indexOf(char);
    if (index === -1) {
      throw new Error(`Invalid Base62 character detected: "${char}"`);
    }
    result = result * BASE + BigInt(index);
  }
  return result;
}

/**
 * Generates a unique Base62 short code from high-precision epoch timestamp + cryptographically random entropy.
 * Verifies that the resulting code does not collide with existing reserved or taken codes.
 */
export function generateBase62Code(
  existingCodes: string[] = [],
  desiredLength = 6
): string {
  const existingSet = new Set(existingCodes.map((c) => c.toLowerCase()));
  let attempts = 0;

  while (attempts < 50) {
    attempts++;
    // Combine current high-res timestamp with random entropy
    const timestampPart = BigInt(Date.now() - 1700000000000); // reduced epoch offset for compact length
    const randomBuffer = new Uint16Array(1);
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(randomBuffer);
    } else {
      randomBuffer[0] = Math.floor(Math.random() * 65535);
    }
    
    // Shift timestamp and mix in random buffer
    const mixedId = (timestampPart * 65536n) + BigInt(randomBuffer[0]);
    let code = encodeBase62(mixedId);

    // Normalize length if necessary
    if (code.length < desiredLength) {
      code = code.padStart(desiredLength, '0');
    } else if (code.length > desiredLength + 2) {
      code = code.slice(-desiredLength);
    }

    if (!existingSet.has(code.toLowerCase())) {
      return code;
    }
  }

  // Fallback unique timestamp if repeated collisions occur
  return 'lp' + Date.now().toString(36).slice(-5);
}

/**
 * Validates destination URLs using the native Web URL parser.
 * Strictly accepts only http: and https: protocols.
 */
export function validateDestinationUrl(input: string): {
  valid: boolean;
  error?: string;
  normalizedUrl?: string;
  parsedUrl?: URL;
} {
  if (!input || typeof input !== 'string') {
    return { valid: false, error: 'URL cannot be empty' };
  }

  let trimmed = input.trim();
  // Auto-prepend https:// if user entered plain domain without protocol
  if (!/^https?:\/\//i.test(trimmed)) {
    if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(trimmed)) {
      trimmed = 'https://' + trimmed;
    } else {
      return { valid: false, error: 'Destination URL must include http:// or https://' };
    }
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        valid: false,
        error: `Protocol "${parsed.protocol}" is not supported. Only HTTP and HTTPS are permitted.`,
      };
    }

    if (!parsed.hostname || parsed.hostname.length < 3 || !parsed.hostname.includes('.')) {
      // Allow localhost for dev testing
      if (parsed.hostname !== 'localhost') {
        return { valid: false, error: 'Please enter a valid, complete domain name.' };
      }
    }

    return { valid: true, normalizedUrl: parsed.href, parsedUrl: parsed };
  } catch (err: any) {
    return { valid: false, error: 'Malformed URL: ' + (err.message || 'Invalid format') };
  }
}

/**
 * Validates custom alias format and length.
 * Must be 3-30 characters: alphanumeric, hyphens, and underscores.
 */
export function validateCustomAlias(alias: string, existingCodes: string[] = []): {
  valid: boolean;
  error?: string;
} {
  const clean = alias.trim();
  if (!clean) {
    return { valid: false, error: 'Alias cannot be empty' };
  }

  if (clean.length < 3) {
    return { valid: false, error: 'Alias must be at least 3 characters long' };
  }

  if (clean.length > 30) {
    return { valid: false, error: 'Alias cannot exceed 30 characters' };
  }

  const aliasRegex = /^[a-zA-Z0-9_-]+$/;
  if (!aliasRegex.test(clean)) {
    return { valid: false, error: 'Alias can only contain letters, numbers, hyphens, and underscores' };
  }

  const reserved = new Set([
    'app', 'admin', 'guest', 'api', 'login', 'signin', 'signup', 'register',
    'dashboard', 'links', 'settings', 'qr', 'bio', 'terms', 'privacy', 'help',
    'support', 'logout', 'status', 'r', 'b', 'u'
  ]);

  if (reserved.has(clean.toLowerCase())) {
    return { valid: false, error: `"${clean}" is a reserved system path and cannot be used as an alias.` };
  }

  const isDuplicate = existingCodes.some((c) => c.toLowerCase() === clean.toLowerCase());
  if (isDuplicate) {
    return { valid: false, error: `The alias "${clean}" is already in use by another link.` };
  }

  return { valid: true };
}
