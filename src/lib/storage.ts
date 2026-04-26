export interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface DocumentStore {
  activeDocId: string | null;
  documents: Record<string, Document>;
}

const STORAGE_KEY_DOCS = 'cromulent:documents';
const STORAGE_KEY_ACTIVE = 'cromulent:activeDocId';

export function loadStore(): DocumentStore {
  try {
    const docsJson = localStorage.getItem(STORAGE_KEY_DOCS);
    const activeId = localStorage.getItem(STORAGE_KEY_ACTIVE);

    if (docsJson) {
      const documents = JSON.parse(docsJson) as Record<string, Document>;
      const validActive =
        activeId && documents[activeId]
          ? activeId
          : (Object.keys(documents)[0] ?? null);
      return { documents, activeDocId: validActive };
    }

    // Migrate from legacy single-document format
    const legacyContent = localStorage.getItem('cromulent:content');
    const legacyTitle = localStorage.getItem('cromulent:title');
    if (legacyContent) {
      const doc = createDocument(legacyTitle || 'Untitled', legacyContent);
      const documents = { [doc.id]: doc };
      saveDocuments(documents);
      saveActiveDocId(doc.id);
      return { documents, activeDocId: doc.id };
    }

    return { documents: {}, activeDocId: null };
  } catch {
    return { documents: {}, activeDocId: null };
  }
}

export function saveDocuments(documents: Record<string, Document>): void {
  localStorage.setItem(STORAGE_KEY_DOCS, JSON.stringify(documents));
}

export function saveActiveDocId(id: string | null): void {
  if (id) {
    localStorage.setItem(STORAGE_KEY_ACTIVE, id);
  } else {
    localStorage.removeItem(STORAGE_KEY_ACTIVE);
  }
}

export function createDocument(
  title = 'Untitled',
  content = '<p></p>'
): Document {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title,
    content,
    createdAt: now,
    updatedAt: now
  };
}

export function updateDocument(
  id: string,
  store: DocumentStore,
  updates: Partial<Pick<Document, 'title' | 'content'>>
): DocumentStore {
  const doc = store.documents[id];
  if (!doc) return store;

  return {
    ...store,
    documents: {
      ...store.documents,
      [id]: {
        ...doc,
        ...updates,
        updatedAt: Date.now()
      }
    }
  };
}

export function deleteDocument(
  id: string,
  store: DocumentStore
): DocumentStore {
  const { [id]: _, ...rest } = store.documents;
  const remainingIds = Object.keys(rest);

  return {
    documents: rest,
    activeDocId:
      store.activeDocId === id ? (remainingIds[0] ?? null) : store.activeDocId
  };
}

export function getDocumentTitleList(
  store: DocumentStore
): Array<{ id: string; title: string }> {
  return Object.values(store.documents).map((doc) => ({
    id: doc.id,
    title: doc.title
  }));
}
