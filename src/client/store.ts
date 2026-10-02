import type { ObservableSnapshot } from "@deepseek-ai/dsh-client-store";
import {
  type BrandSettings,
  DEFAULT_SETTINGS,
  decodeSettings,
  equalSettings,
  STORAGE_KEY,
} from "./settings.ts";

export interface SettingsStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export class BrandStore implements ObservableSnapshot<BrandSettings> {
  private snapshot: BrandSettings = { ...DEFAULT_SETTINGS };
  private readonly listeners = new Set<() => void>();
  private readonly storage: SettingsStorage | null;

  constructor(storage: SettingsStorage | null) {
    this.storage = storage;
    try {
      const raw = storage?.getItem(STORAGE_KEY);
      if (raw) this.snapshot = decodeSettings(JSON.parse(raw)) ?? { ...DEFAULT_SETTINGS };
    } catch {
      // Unavailable or malformed storage must never prevent DSH from booting.
    }
  }

  getSnapshot = (): BrandSettings => this.snapshot;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  commit(value: BrandSettings): BrandSettings {
    const settings = decodeSettings(value);
    if (!settings) throw new Error("invalid-settings");
    if (!this.storage) throw new Error("storage-unavailable");
    // Persist first: quota/privacy errors leave the active branding untouched.
    this.storage.setItem(STORAGE_KEY, JSON.stringify(settings));
    this.publish(settings);
    return this.snapshot;
  }

  acceptExternal(raw: string | null): void {
    if (raw === null) {
      this.publish({ ...DEFAULT_SETTINGS });
      return;
    }
    try {
      const settings = decodeSettings(JSON.parse(raw));
      if (settings) this.publish(settings);
    } catch {
      // Ignore malformed writes by other tabs; keep the last valid snapshot.
    }
  }

  private publish(value: BrandSettings): void {
    if (equalSettings(value, this.snapshot)) return;
    this.snapshot = value;
    for (const listener of this.listeners) listener();
  }
}
