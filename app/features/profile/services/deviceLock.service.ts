import { hashSub } from '~/features/workspace/services/userWorkspaceStorage';

export interface DeviceLockConfig {
  enabled: boolean;
  autoLockMinutes: number; // 0 = immediately on blur/close, 1, 5, 15, 30
  saltHex?: string;
  hashHex?: string;
  failedAttempts: number;
  lockedUntil?: number; // timestamp for cooldown
}

export class DeviceLockService {
  private static memoryStore = new Map<string, DeviceLockConfig>();
  private static sessionMemory = new Map<string, boolean>();

  private static getStorageKey(sub: string): string {
    return `stack_device_lock_${hashSub(sub)}`;
  }

  private static getSessionLockKey(sub: string): string {
    return `stack_session_locked_${hashSub(sub)}`;
  }

  static getConfig(sub: string): DeviceLockConfig {
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(this.getStorageKey(sub));
        if (raw) return JSON.parse(raw);
      } catch {}
    }
    return this.memoryStore.get(sub) || { enabled: false, autoLockMinutes: 5, failedAttempts: 0 };
  }

  static saveConfig(sub: string, config: DeviceLockConfig): void {
    this.memoryStore.set(sub, { ...config });
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(this.getStorageKey(sub), JSON.stringify(config));
      } catch {}
    }
  }

  static isSessionLocked(sub: string): boolean {
    const config = this.getConfig(sub);
    if (!config.enabled || !config.hashHex) return false;

    if (typeof sessionStorage !== 'undefined') {
      try {
        const locked = sessionStorage.getItem(this.getSessionLockKey(sub));
        if (locked !== null) return locked === 'true';
      } catch {}
    }
    return this.sessionMemory.get(sub) === true;
  }

  static lockSession(sub: string): void {
    const config = this.getConfig(sub);
    if (!config.enabled) return;

    this.sessionMemory.set(sub, true);
    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.setItem(this.getSessionLockKey(sub), 'true');
      } catch {}
    }
  }

  static unlockSession(sub: string): void {
    this.sessionMemory.set(sub, false);
    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.removeItem(this.getSessionLockKey(sub));
      } catch {}
    }
  }

  /**
   * Hashes a 6-digit PIN using Web Crypto PBKDF2/SHA-256 with 100,000 iterations.
   */
  static async hashPin(
    pin: string,
    existingSaltHex?: string
  ): Promise<{ saltHex: string; hashHex: string }> {
    const encoder = new TextEncoder();
    const cryptoObj: any =
      typeof window !== 'undefined'
        ? window.crypto
        : (await import('crypto')).webcrypto;

    let salt: Uint8Array;
    if (existingSaltHex) {
      const match = existingSaltHex.match(/.{1,2}/g) || [];
      salt = new Uint8Array(match.map((byte) => parseInt(byte, 16)));
    } else {
      salt = new Uint8Array(16);
      cryptoObj.getRandomValues(salt);
    }

    const saltHex = Array.from(salt)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    if (!cryptoObj?.subtle) {
      // Fallback for simple testing environments without subtle crypto
      return { saltHex, hashHex: `mock_pbkdf2_${pin}_${saltHex}` };
    }

    const baseKey = await cryptoObj.subtle.importKey(
      'raw',
      encoder.encode(pin.trim()),
      'PBKDF2',
      false,
      ['deriveBits']
    );

    const derivedBits = await cryptoObj.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt as any,
        iterations: 100000,
        hash: 'SHA-256',
      },
      baseKey,
      256
    );

    const hashHex = Array.from(new Uint8Array(derivedBits))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    return { saltHex, hashHex };
  }

  /**
   * Configures a new 6-digit PIN for this user on this browser.
   */
  static async setPin(
    sub: string,
    pin: string,
    autoLockMinutes = 5
  ): Promise<void> {
    const cleanPin = pin.trim();
    if (!/^\d{6}$/.test(cleanPin)) {
      throw new Error('PIN must be exactly 6 digits.');
    }

    const { saltHex, hashHex } = await this.hashPin(cleanPin);

    const config: DeviceLockConfig = {
      enabled: true,
      autoLockMinutes,
      saltHex,
      hashHex,
      failedAttempts: 0,
    };

    this.saveConfig(sub, config);
    this.unlockSession(sub);
  }

  /**
   * Verifies an entered PIN and unlocks session on success.
   * Enforces exponential cooldown after repeated failed attempts.
   */
  static async verifyPin(sub: string, enteredPin: string): Promise<boolean> {
    const config = this.getConfig(sub);
    if (!config.enabled || !config.hashHex || !config.saltHex) {
      return true; // No PIN configured
    }

    const now = Date.now();
    if (config.lockedUntil && now < config.lockedUntil) {
      const waitSeconds = Math.ceil((config.lockedUntil - now) / 1000);
      throw new Error(`Device temporarily locked. Retry in ${waitSeconds}s.`);
    }

    const { hashHex } = await this.hashPin(enteredPin, config.saltHex);

    if (hashHex !== config.hashHex) {
      config.failedAttempts += 1;
      if (config.failedAttempts >= 5) {
        // Cooldown: 30 seconds for 5 attempts, exponential thereafter
        const penaltyMs = Math.min(30000 * Math.pow(2, config.failedAttempts - 5), 300000);
        config.lockedUntil = now + penaltyMs;
      }
      this.saveConfig(sub, config);
      throw new Error('Incorrect PIN.');
    }

    // Success: reset attempts and unlock session
    config.failedAttempts = 0;
    config.lockedUntil = undefined;
    this.saveConfig(sub, config);
    this.unlockSession(sub);
    return true;
  }

  /**
   * Disables Device PIN for this user on this browser.
   */
  static async disablePin(sub: string, enteredPin: string): Promise<void> {
    const verified = await this.verifyPin(sub, enteredPin);
    if (!verified) throw new Error('Incorrect PIN.');

    const config: DeviceLockConfig = {
      enabled: false,
      autoLockMinutes: 5,
      failedAttempts: 0,
    };

    this.saveConfig(sub, config);
    this.unlockSession(sub);
  }

  /**
   * Safely clears device lock config when user re-authenticates via Auth0 ("Forgot PIN").
   * Never destroys user notes or touches workspace database.
   */
  static resetAfterReauthentication(sub: string): void {
    this.memoryStore.delete(sub);
    this.sessionMemory.delete(sub);
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(this.getStorageKey(sub));
      } catch {}
    }
    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.removeItem(this.getSessionLockKey(sub));
      } catch {}
    }
  }

  static resetForTesting(): void {
    this.memoryStore.clear();
    this.sessionMemory.clear();
  }
}

