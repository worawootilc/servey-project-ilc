const ADMIN_SESSION_KEY = 'coffeesmitr_admin_session_v1';
const ADMIN_PASSCODE_HASH_KEY = 'coffeesmitr_admin_pass_hash_v1';

// SHA-256 hex of default admin passcode
const DEFAULT_ADMIN_HASH =
  '5a8e76c598b71fb21754b69092e01c64f8ba6601672caa30565bda0368556401';

// Pure JS SHA-256 fallback for non-HTTPS local preview environments
function sha256Fallback(ascii: string): string {
  const rightRotate = (value: number, amount: number) =>
    (value >>> amount) | (value << (32 - amount));

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;

  const hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;

  const isComposite: Record<number, number> = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (let i = 0; i < 313; i += candidate) {
        isComposite[i] = candidate;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  ascii += '\x80';
  while ((ascii.length % 64) - 56) ascii += '\x00';
  for (let i = 0; i < ascii.length; i++) {
    const j = ascii.charCodeAt(i);
    if (j >> 8) return '';
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength;

  for (let j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash.slice(0);

    for (let i = 0; i < 64; i++) {
      const w15 = w[i - 15];
      const w2 = w[i - 2];

      const a = hash[0];
      const e = hash[4];
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);

      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

      hash[7] = hash[6];
      hash[6] = hash[5];
      hash[5] = hash[4];
      hash[4] = (hash[3] + temp1) | 0;
      hash[3] = hash[2];
      hash[2] = hash[1];
      hash[1] = hash[0];
      hash[0] = (temp1 + temp2) | 0;
    }

    for (let i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (let i = 0; i < 8; i++) {
    for (let j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

async function hashPasscode(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const digest = await crypto.subtle.digest('SHA-256', bytes);
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    } catch {
      // fallback below
    }
  }
  const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join('');
  return sha256Fallback(binary);
}

function getExpectedHash(): string {
  try {
    const custom = localStorage.getItem(ADMIN_PASSCODE_HASH_KEY);
    return custom && /^[a-f0-9]{64}$/.test(custom) ? custom : DEFAULT_ADMIN_HASH;
  } catch {
    return DEFAULT_ADMIN_HASH;
  }
}

export function isAdminSessionActive(): boolean {
  try {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export async function verifyAndUnlockAdmin(passcode: string): Promise<boolean> {
  const trimmed = passcode.trim();
  if (!trimmed) return false;
  const candidateHash = await hashPasscode(trimmed);
  const ok = candidateHash === getExpectedHash();
  if (ok) {
    try {
      sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
    } catch {
      // ignore storage errors
    }
  }
  return ok;
}

export function lockAdminSession(): void {
  try {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  } catch {
    // ignore storage errors
  }
}

export async function updateAdminPasscode(newPasscode: string): Promise<void> {
  const trimmed = newPasscode.trim();
  if (trimmed.length < 4) {
    throw new Error('รหัสผ่าน Admin ต้องมีความยาวอย่างน้อย 4 ตัวอักษร');
  }
  const nextHash = await hashPasscode(trimmed);
  try {
    localStorage.setItem(ADMIN_PASSCODE_HASH_KEY, nextHash);
  } catch {
    // ignore storage errors
  }
}

export function resetAdminPasscodeToDefault(): void {
  try {
    localStorage.removeItem(ADMIN_PASSCODE_HASH_KEY);
  } catch {
    // ignore storage errors
  }
}
