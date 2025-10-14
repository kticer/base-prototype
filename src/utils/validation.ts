import type { DocumentData, FolderOrDocument, MatchCard, Highlight, Page, MatchInstance, MatchSourceType } from '../types';

/**
 * Runtime validation utilities for type safety
 * These functions provide runtime type checking to prevent errors from malformed data
 */

// Basic type guards

/**
 * Type guard to check if a value is a string
 * @param value - The value to check
 * @returns true if value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Type guard to check if a value is a valid number (not NaN)
 * @param value - The value to check
 * @returns true if value is a number and not NaN
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Type guard to check if a value is a positive number (> 0)
 * @param value - The value to check
 * @returns true if value is a positive number
 */
export function isPositiveNumber(value: unknown): value is number {
  return isNumber(value) && value > 0;
}

/**
 * Type guard to check if a value is a non-negative number (>= 0)
 * @param value - The value to check
 * @returns true if value is a non-negative number
 */
export function isNonNegativeNumber(value: unknown): value is number {
  return isNumber(value) && value >= 0;
}

/**
 * Type guard to check if a value is an array of items matching a specific type
 * @param value - The value to check
 * @param itemGuard - Type guard function for individual array items
 * @returns true if value is an array and all items match the type guard
 */
export function isArray<T>(value: unknown, itemGuard: (item: unknown) => item is T): value is T[] {
  return Array.isArray(value) && value.every(itemGuard);
}

// Specific type guards for application types

/**
 * Type guard to check if a value is a valid match source type
 * @param value - The value to check
 * @returns true if value is a valid MatchSourceType
 */
export function isMatchSourceType(value: unknown): value is MatchSourceType {
  return isString(value) && ['Internet', 'Submitted Works', 'Publication'].includes(value);
}

export function isPage(value: unknown): value is Page {
  if (typeof value !== 'object' || value === null) return false;
  
  const obj = value as Record<string, unknown>;
  return (
    'number' in obj &&
    'content' in obj &&
    isPositiveNumber(obj.number) &&
    isString(obj.content)
  );
}

export function isHighlight(value: unknown): value is Highlight {
  if (typeof value !== 'object' || value === null) return false;
  
  const obj = value as Record<string, unknown>;
  return (
    'id' in obj &&
    'matchCardId' in obj &&
    'startOffset' in obj &&
    'endOffset' in obj &&
    'text' in obj &&
    'isExcluded' in obj &&
    'page' in obj &&
    isString(obj.id) &&
    isString(obj.matchCardId) &&
    isNonNegativeNumber(obj.startOffset) &&
    isNonNegativeNumber(obj.endOffset) &&
    isString(obj.text) &&
    typeof obj.isExcluded === 'boolean' &&
    isPositiveNumber(obj.page)
  );
}

export function isMatchInstance(value: unknown): value is MatchInstance {
  if (typeof value !== 'object' || value === null) return false;
  
  const obj = value as Record<string, unknown>;
  return (
    'highlightId' in obj &&
    'contextBefore' in obj &&
    'matchedText' in obj &&
    'contextAfter' in obj &&
    isString(obj.highlightId) &&
    isString(obj.contextBefore) &&
    isString(obj.matchedText) &&
    isString(obj.contextAfter)
  );
}

export function isMatchCard(value: unknown): value is MatchCard {
  if (typeof value !== 'object' || value === null) return false;
  
  const obj = value as Record<string, unknown>;
  return (
    'id' in obj &&
    'sourceType' in obj &&
    'sourceName' in obj &&
    'similarityPercent' in obj &&
    'matchedWordCount' in obj &&
    'matches' in obj &&
    isString(obj.id) &&
    isMatchSourceType(obj.sourceType) &&
    isString(obj.sourceName) &&
    isNonNegativeNumber(obj.similarityPercent) &&
    isNonNegativeNumber(obj.matchedWordCount) &&
    isArray(obj.matches, isMatchInstance) &&
    (!obj.sourceUrl || isString(obj.sourceUrl))
  );
}

export function isDocumentData(value: unknown): value is DocumentData {
  if (typeof value !== 'object' || value === null) return false;
  
  const obj = value as Record<string, unknown>;
  return (
    'id' in obj &&
    'title' in obj &&
    'author' in obj &&
    'pages' in obj &&
    'highlights' in obj &&
    'matchCards' in obj &&
    isString(obj.id) &&
    isString(obj.title) &&
    isString(obj.author) &&
    isArray(obj.pages, isPage) &&
    isArray(obj.highlights, isHighlight) &&
    isArray(obj.matchCards, isMatchCard)
  );
}

export function isFolderOrDocument(value: unknown): value is FolderOrDocument {
  if (typeof value !== 'object' || value === null) return false;
  
  const obj = value as Record<string, unknown>;
  
  // Check common properties
  if (!isString(obj.id) || !isString(obj.title) || !isString(obj.dateAdded)) {
    return false;
  }
  
  // Check type-specific properties
  if (obj.type === 'folder') {
    return !obj.children || isArray(obj.children, isFolderOrDocument);
  } else if (obj.type === 'document') {
    return isString(obj.author) && isNonNegativeNumber(obj.similarity);
  }
  
  return false;
}

// Validation functions that throw errors

/**
 * Validates that data conforms to the DocumentData interface
 * @param data - The data to validate
 * @returns The validated DocumentData object
 * @throws Error if data doesn't match DocumentData structure
 */
export function validateDocumentData(data: unknown): DocumentData {
  if (!isDocumentData(data)) {
    throw new Error('Invalid document data structure');
  }
  return data;
}

/**
 * Validates that data is an array of FolderOrDocument objects
 * @param data - The data to validate
 * @returns The validated array of FolderOrDocument objects
 * @throws Error if data doesn't match expected structure
 */
export function validateFolderStructure(data: unknown): FolderOrDocument[] {
  if (!isArray(data, isFolderOrDocument)) {
    throw new Error('Invalid folder structure');
  }
  return data;
}

// Numeric input validation
export function validateNumericInput(value: string, min: number, max: number, fieldName: string): number {
  const num = Number(value);
  if (isNaN(num)) {
    throw new Error(`${fieldName} must be a valid number`);
  }
  if (num < min || num > max) {
    throw new Error(`${fieldName} must be between ${min} and ${max}`);
  }
  return num;
}

// URL validation
export function validateDocumentId(id: string | undefined): string {
  if (!id || !isString(id) || id.trim().length === 0) {
    throw new Error('Invalid document ID');
  }
  return id.trim();
}

export function validateUrl(url: string): string {
  try {
    new URL(url);
    return url;
  } catch {
    throw new Error('Invalid URL format');
  }
}

// Safe JSON parsing
export function safeJsonParse<T>(json: string, validator: (data: unknown) => data is T): T {
  try {
    const parsed = JSON.parse(json);
    if (!validator(parsed)) {
      throw new Error('Data does not match expected type');
    }
    return parsed;
  } catch (error) {
    throw new Error(`JSON parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}