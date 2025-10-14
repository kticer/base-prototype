/**
 * User Data Persistence Service
 * 
 * Handles saving, loading, and managing user-generated content in localStorage
 * with support for versioning, migration, and cleanup.
 */

import type { UserState, PersistenceConfig } from '../types/userContent';

/**
 * Default configuration for the persistence system
 */
const DEFAULT_CONFIG: PersistenceConfig = {
  storagePrefix: 'ithenticate_user_',
  autoSaveInterval: 2000, // 2 seconds
  maxStoredDocuments: 50,
  enableCompression: false, // Can enable if data gets large
};

/**
 * Error types for persistence operations
 */
export class PersistenceError extends Error {
  public code: string;
  
  constructor(message: string, code: string) {
    super(message);
    this.name = 'PersistenceError';
    this.code = code;
  }
}

/**
 * Service for managing user data persistence
 */
export class UserDataPersistence {
  private config: PersistenceConfig;
  private readonly APP_VERSION = '1.0.0'; // Should come from package.json in real app

  constructor(config: Partial<PersistenceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate storage key for a document
   */
  private getStorageKey(documentId: string): string {
    return `${this.config.storagePrefix}${documentId}`;
  }

  /**
   * Generate metadata storage key for tracking stored documents
   */
  private getMetadataKey(): string {
    return `${this.config.storagePrefix}metadata`;
  }

  /**
   * Get current timestamp as ISO string
   */
  private getCurrentTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Create empty user state for a document
   */
  private createEmptyUserState(documentId: string): UserState {
    const timestamp = this.getCurrentTimestamp();

    return {
      documentId,
      version: this.APP_VERSION,
      comments: [],
      pointAnnotations: [],
      textualContent: {
        notes: [],
      },
      grading: {
        rubricScores: [],
        gradingCriteria: [],
      },
      customHighlights: [],
      metadata: {},
      createdAt: timestamp,
      lastModified: timestamp,
    };
  }

  /**
   * Validate user state structure
   */
  private validateUserState(data: any): data is UserState {
    if (!data || typeof data !== 'object') return false;

    // Basic structure validation
    return (
      typeof data.documentId === 'string' &&
      typeof data.version === 'string' &&
      Array.isArray(data.comments) &&
      Array.isArray(data.pointAnnotations) &&
      typeof data.textualContent === 'object' &&
      typeof data.grading === 'object' &&
      Array.isArray(data.customHighlights) &&
      typeof data.metadata === 'object' &&
      typeof data.createdAt === 'string' &&
      typeof data.lastModified === 'string'
    );
  }

  /**
   * Compress data if compression is enabled
   */
  private compressData(data: string): string {
    if (!this.config.enableCompression) return data;
    
    // Simple compression - in production might use LZ-string or similar
    // For now, just return as-is
    return data;
  }

  /**
   * Decompress data if compression is enabled
   */
  private decompressData(data: string): string {
    if (!this.config.enableCompression) return data;
    
    // Simple decompression - in production might use LZ-string or similar
    // For now, just return as-is
    return data;
  }

  /**
   * Update metadata about stored documents
   */
  private updateMetadata(documentId: string, action: 'add' | 'remove'): void {
    try {
      const metadataKey = this.getMetadataKey();
      const existing = localStorage.getItem(metadataKey);
      const metadata = existing ? JSON.parse(existing) : { documents: [], lastCleanup: null };
      
      if (action === 'add') {
        if (!metadata.documents.includes(documentId)) {
          metadata.documents.push(documentId);
          
          // Enforce max documents limit
          if (metadata.documents.length > this.config.maxStoredDocuments) {
            const toRemove = metadata.documents.shift();
            if (toRemove) {
              localStorage.removeItem(this.getStorageKey(toRemove));
            }
          }
        }
      } else if (action === 'remove') {
        metadata.documents = metadata.documents.filter((id: string) => id !== documentId);
      }
      
      localStorage.setItem(metadataKey, JSON.stringify(metadata));
    } catch (error) {
      console.warn('Failed to update persistence metadata:', error);
    }
  }

  /**
   * Save user state to localStorage
   */
  saveUserState(documentId: string, userState: UserState): void {
    try {
      // Update last modified timestamp
      const stateToSave = {
        ...userState,
        lastModified: this.getCurrentTimestamp(),
      };
      
      const serialized = JSON.stringify(stateToSave);
      const compressed = this.compressData(serialized);
      const storageKey = this.getStorageKey(documentId);
      
      localStorage.setItem(storageKey, compressed);
      this.updateMetadata(documentId, 'add');
      
      console.log(`✅ Saved user state for document: ${documentId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new PersistenceError(`Failed to save user state: ${message}`, 'SAVE_FAILED');
    }
  }

  /**
   * Load user state from localStorage
   */
  loadUserState(documentId: string): UserState | null {
    try {
      const storageKey = this.getStorageKey(documentId);
      const compressed = localStorage.getItem(storageKey);
      
      if (!compressed) {
        return null;
      }
      
      const serialized = this.decompressData(compressed);
      const data = JSON.parse(serialized);
      
      if (!this.validateUserState(data)) {
        console.warn(`Invalid user state structure for document: ${documentId}`);
        return null;
      }
      
      // Check if migration is needed
      if (data.version !== this.APP_VERSION) {
        console.log(`Migrating user state from ${data.version} to ${this.APP_VERSION}`);
        return this.migrateUserState(data, data.version, this.APP_VERSION);
      }
      
      console.log(`✅ Loaded user state for document: ${documentId}`);
      return data;
    } catch (error) {
      console.error(`Failed to load user state for document ${documentId}:`, error);
      return null;
    }
  }

  /**
   * Clear user state for a specific document
   */
  clearUserState(documentId: string): void {
    try {
      const storageKey = this.getStorageKey(documentId);
      localStorage.removeItem(storageKey);
      this.updateMetadata(documentId, 'remove');
      
      console.log(`🗑️ Cleared user state for document: ${documentId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new PersistenceError(`Failed to clear user state: ${message}`, 'CLEAR_FAILED');
    }
  }

  /**
   * Reset document to pristine state (create empty user state)
   */
  resetToDefault(documentId: string): UserState {
    this.clearUserState(documentId);
    const emptyState = this.createEmptyUserState(documentId);
    this.saveUserState(documentId, emptyState);
    
    console.log(`🔄 Reset document to pristine state: ${documentId}`);
    return emptyState;
  }

  /**
   * Get list of all documents with user data
   */
  getStoredDocuments(): string[] {
    try {
      const metadataKey = this.getMetadataKey();
      const metadata = localStorage.getItem(metadataKey);
      
      if (!metadata) return [];
      
      const parsed = JSON.parse(metadata);
      return Array.isArray(parsed.documents) ? parsed.documents : [];
    } catch (error) {
      console.error('Failed to get stored documents list:', error);
      return [];
    }
  }

  /**
   * Export user state as JSON string
   */
  exportUserState(documentId: string): string | null {
    const userState = this.loadUserState(documentId);
    if (!userState) return null;
    
    return JSON.stringify(userState, null, 2);
  }

  /**
   * Import user state from JSON string
   */
  importUserState(documentId: string, jsonData: string): UserState {
    try {
      const data = JSON.parse(jsonData);
      
      if (!this.validateUserState(data)) {
        throw new PersistenceError('Invalid user state format', 'INVALID_FORMAT');
      }
      
      // Update document ID and timestamps
      const importedState: UserState = {
        ...data,
        documentId,
        lastModified: this.getCurrentTimestamp(),
      };
      
      this.saveUserState(documentId, importedState);
      
      console.log(`📥 Imported user state for document: ${documentId}`);
      return importedState;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new PersistenceError(`Failed to import user state: ${message}`, 'IMPORT_FAILED');
    }
  }

  /**
   * Migrate user state between versions
   */
  private migrateUserState(data: any, fromVersion: string, toVersion: string): UserState {
    console.log(`Migrating user state from ${fromVersion} to ${toVersion}`);
    
    // For now, just update the version and ensure required fields exist
    const migrated: UserState = {
      ...this.createEmptyUserState(data.documentId),
      ...data,
      version: toVersion,
      lastModified: this.getCurrentTimestamp(),
    };
    
    // Save the migrated state
    this.saveUserState(data.documentId, migrated);
    
    return migrated;
  }

  /**
   * Clean up old or corrupted data
   */
  cleanup(): void {
    try {
      const documents = this.getStoredDocuments();
      let cleaned = 0;
      
      documents.forEach(documentId => {
        const userState = this.loadUserState(documentId);
        if (!userState) {
          this.clearUserState(documentId);
          cleaned++;
        }
      });
      
      console.log(`🧹 Cleaned up ${cleaned} corrupted user states`);
    } catch (error) {
      console.error('Failed to cleanup user data:', error);
    }
  }

  /**
   * Get storage usage statistics
   */
  getStorageStats(): { totalDocuments: number; totalSizeKB: number } {
    const documents = this.getStoredDocuments();
    let totalSize = 0;
    
    documents.forEach(documentId => {
      const storageKey = this.getStorageKey(documentId);
      const data = localStorage.getItem(storageKey);
      if (data) {
        totalSize += new Blob([data]).size;
      }
    });
    
    return {
      totalDocuments: documents.length,
      totalSizeKB: Math.round(totalSize / 1024),
    };
  }
}

/**
 * Default instance of the persistence service
 */
export const userDataPersistence = new UserDataPersistence();