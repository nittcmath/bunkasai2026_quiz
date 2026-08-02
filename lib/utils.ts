import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function nowIso() {
  return new Date().toISOString();
}

export function uuid() {
  return crypto.randomUUID();
}

export function normalizeText(text: string) {
  return text
    .normalize('NFKC')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

export function safeNumber(input: unknown, fallback = 0) {
  const value = typeof input === 'number' ? input : Number(input);
  return Number.isFinite(value) ? value : fallback;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function uniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}
