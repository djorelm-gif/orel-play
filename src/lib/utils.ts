import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function randomCode(length = 6): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export function randomToken(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `tok_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

export function weightedPick<T extends { wheel_weight?: number }>(items: T[]): T | null {
  if (items.length === 0) return null;
  const total = items.reduce((sum, item) => sum + Math.max(item.wheel_weight ?? 1, 1), 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= Math.max(item.wheel_weight ?? 1, 1);
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '★';
}
