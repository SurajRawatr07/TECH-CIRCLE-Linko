import { z } from 'zod';

export const RESERVED_WORDS = [
  'admin',
  'login',
  'signup',
  'app',
  'api',
  'r',
  'auth',
  'settings',
  'dashboard',
  'links',
  'qr',
  'campaigns',
  'tags',
  'status',
  'terms',
  'privacy',
  'about',
];

// Name validation: 2-50 characters, letters and spaces only
export const NameSchema = z
  .string()
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name cannot exceed 50 characters')
  .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces');

// Email validation: standard email format, lowercase trimmed, max 100 characters
export const EmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(100, 'Email cannot exceed 100 characters')
  .email('Enter a valid email address (e.g. user@domain.com)');

// Password rules inspection helper
export interface PasswordRuleCheck {
  id: string;
  label: string;
  valid: boolean;
}

export function checkPasswordRules(password: string): {
  rules: PasswordRuleCheck[];
  strength: 'Weak' | 'Medium' | 'Strong';
  score: number;
} {
  const rules: PasswordRuleCheck[] = [
    {
      id: 'length',
      label: '8 to 64 characters',
      valid: password.length >= 8 && password.length <= 64,
    },
    {
      id: 'uppercase',
      label: 'At least 1 uppercase letter (A-Z)',
      valid: /[A-Z]/.test(password),
    },
    {
      id: 'lowercase',
      label: 'At least 1 lowercase letter (a-z)',
      valid: /[a-z]/.test(password),
    },
    {
      id: 'number',
      label: 'At least 1 number (0-9)',
      valid: /[0-9]/.test(password),
    },
    {
      id: 'special',
      label: 'At least 1 special character (!@#$%^&*)',
      valid: /[!@#$%^&*]/.test(password),
    },
    {
      id: 'no_spaces',
      label: 'No spaces allowed',
      valid: password.length > 0 && !/\s/.test(password),
    },
  ];

  const validCount = rules.filter((r) => r.valid).length;
  let strength: 'Weak' | 'Medium' | 'Strong' = 'Weak';
  if (validCount === 6) {
    strength = 'Strong';
  } else if (validCount >= 4) {
    strength = 'Medium';
  }

  return { rules, strength, score: validCount };
}

export const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(64, 'Password must be at most 64 characters')
  .regex(/[A-Z]/, 'Must contain at least 1 uppercase letter')
  .regex(/[a-z]/, 'Must contain at least 1 lowercase letter')
  .regex(/[0-9]/, 'Must contain at least 1 number')
  .regex(/[!@#$%^&*]/, 'Must contain at least 1 special character (!@#$%^&*)')
  .regex(/^\S+$/, 'Spaces are not permitted');

export function validateUrl(
  urlInput: string,
  blocklist: string[] = []
): { valid: boolean; error?: string; hostname?: string; isBlocklisted?: boolean } {
  if (!urlInput || !urlInput.trim()) {
    return { valid: false, error: 'Destination URL is required.' };
  }

  const trimmed = urlInput.trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, error: 'Invalid URL. Please include http:// or https://' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, error: 'Only HTTP and HTTPS destination URLs are allowed.' };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Self loop prevention
  if (
    hostname === 'linko.io' ||
    hostname === 'linko.app' ||
    hostname === 'linkpulse.io' ||
    (typeof window !== 'undefined' && hostname === window.location.hostname)
  ) {
    return { valid: false, error: 'Self-referencing redirects are not permitted.' };
  }

  // Blocklist verification
  const isBlocked = blocklist.some(
    (b) => hostname === b.toLowerCase() || hostname.endsWith('.' + b.toLowerCase())
  );
  if (isBlocked) {
    return {
      valid: false,
      error: `Destination domain "${hostname}" is on the platform safety blocklist.`,
      hostname,
      isBlocklisted: true,
    };
  }

  return { valid: true, hostname };
}

export function validateAlias(
  alias: string,
  existingCodes: string[] = []
): { valid: boolean; error?: string } {
  if (!alias || !alias.trim()) {
    return { valid: false, error: 'Alias is required.' };
  }

  const trimmed = alias.trim();
  if (trimmed.length < 3) {
    return { valid: false, error: 'Alias must be at least 3 characters long.' };
  }
  if (trimmed.length > 30) {
    return { valid: false, error: 'Alias cannot exceed 30 characters.' };
  }

  const regex = /^[a-zA-Z0-9_-]+$/;
  if (!regex.test(trimmed)) {
    return {
      valid: false,
      error: 'Alias can only contain letters, numbers, hyphens, and underscores.',
    };
  }

  if (RESERVED_WORDS.includes(trimmed.toLowerCase())) {
    return {
      valid: false,
      error: `"${trimmed}" is a reserved word and cannot be used as a custom alias.`,
    };
  }

  const exists = existingCodes.some((c) => c.toLowerCase() === trimmed.toLowerCase());
  if (exists) {
    return { valid: false, error: 'This alias is already taken. Please choose another.' };
  }

  return { valid: true };
}
