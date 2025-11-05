
import { en, TranslationKeys } from './en';

// Simple translation utility for now. Can be extended for locale management.
export function t(key: TranslationKeys): string {
  return en[key] || `MISSING_TRANSLATION:${key}`;
}
