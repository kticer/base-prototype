/**
 * Utilities for loading course-wide submission data
 */

import type { CourseSubmission } from '../types/courseAnalytics';
import type { DocumentData } from '../types';

/**
 * Recursively extract all document entries from folder structure
 */
function extractDocuments(items: any[]): any[] {
  const documents: any[] = [];

  for (const item of items) {
    if (item.type === 'document') {
      documents.push(item);
    } else if (item.type === 'folder' && item.children) {
      documents.push(...extractDocuments(item.children));
    }
  }

  return documents;
}

/**
 * Load all course submissions from folder structure
 */
export async function loadCourseSubmissions(): Promise<CourseSubmission[]> {
  try {
    // Load folder structure
    const response = await fetch('/data/folder_structure.json');
    if (!response.ok) {
      throw new Error('Failed to load folder structure');
    }
    const folderData = await response.json();

    // Extract all documents
    const documentEntries = extractDocuments(folderData);

    // Load full document data for each submission
    const submissions: CourseSubmission[] = await Promise.all(
      documentEntries.map(async (entry) => {
        try {
          const docResponse = await fetch(`/data/documents/${entry.id}.json`);
          if (!docResponse.ok) {
            console.warn(`Failed to load document: ${entry.id}`);
            return {
              id: entry.id,
              title: entry.title,
              author: entry.author,
              similarity: entry.similarity,
              dateAdded: entry.dateAdded,
            };
          }

          const documentData: DocumentData = await docResponse.json();

          return {
            id: entry.id,
            title: documentData.title || entry.title,
            author: documentData.author || entry.author,
            similarity: entry.similarity,
            dateAdded: entry.dateAdded,
            documentData,
          };
        } catch (error) {
          console.error(`Error loading document ${entry.id}:`, error);
          return {
            id: entry.id,
            title: entry.title,
            author: entry.author,
            similarity: entry.similarity,
            dateAdded: entry.dateAdded,
          };
        }
      })
    );

    console.log(`[Course Data] Loaded ${submissions.length} submissions`);
    return submissions;
  } catch (error) {
    console.error('Error loading course submissions:', error);
    return [];
  }
}

/**
 * Get a single submission by ID
 */
export async function loadSubmissionById(
  id: string
): Promise<CourseSubmission | null> {
  try {
    // Load folder structure to get basic info
    const response = await fetch('/data/folder_structure.json');
    if (!response.ok) {
      throw new Error('Failed to load folder structure');
    }
    const folderData = await response.json();
    const documentEntries = extractDocuments(folderData);
    const entry = documentEntries.find((d) => d.id === id);

    if (!entry) {
      return null;
    }

    // Load full document data
    const docResponse = await fetch(`/data/documents/${id}.json`);
    if (!docResponse.ok) {
      return {
        id: entry.id,
        title: entry.title,
        author: entry.author,
        similarity: entry.similarity,
        dateAdded: entry.dateAdded,
      };
    }

    const documentData: DocumentData = await docResponse.json();

    return {
      id: entry.id,
      title: documentData.title || entry.title,
      author: documentData.author || entry.author,
      similarity: entry.similarity,
      dateAdded: entry.dateAdded,
      documentData,
    };
  } catch (error) {
    console.error(`Error loading submission ${id}:`, error);
    return null;
  }
}
