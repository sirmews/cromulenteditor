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

    // Fresh load — seed with a project notes document
    const welcome = createWelcomeDocument();
    const documents = { [welcome.id]: welcome };
    saveDocuments(documents);
    saveActiveDocId(welcome.id);
    return { documents, activeDocId: welcome.id };
  } catch {
    return { documents: {}, activeDocId: null };
  }
}

function withStorageWriteGuard(write: () => void): void {
  try {
    write();
  } catch {
    // localStorage may fail (quota exceeded / blocked storage); keep in-memory state alive.
  }
}

export function saveDocuments(documents: Record<string, Document>): void {
  withStorageWriteGuard(() => {
    localStorage.setItem(STORAGE_KEY_DOCS, JSON.stringify(documents));
  });
}

export function saveActiveDocId(id: string | null): void {
  withStorageWriteGuard(() => {
    if (id) {
      localStorage.setItem(STORAGE_KEY_ACTIVE, id);
    } else {
      localStorage.removeItem(STORAGE_KEY_ACTIVE);
    }
  });
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

export function createWelcomeDocument(): Document {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: 'Cromulent — project notes',
    content: `<h1>Cromulent Editor</h1>
<p>Privacy-first document editor with a local AI assistant. Everything runs in the browser. No backend, no API keys, no data leaves the machine.</p>
<h2>Stack</h2>
<ul>
<li>React 19 + TypeScript + Vite 8</li>
<li>Tailwind CSS v4 + shadcn/ui</li>
<li>Tiptap 2 for the editor</li>
<li>@huggingface/transformers for local LLM inference (WebGPU / WASM fallback)</li>
<li>Model: Bonsai-1.7B-ONNX (~277 MB–1.0 GB depending on quantization)</li>
</ul>
<h2>Storage</h2>
<ul>
<li>Documents: <code>localStorage</code> as structured JSON (multi-doc)</li>
<li>AI model cache: Browser Cache API under <code>transformers-cache</code></li>
</ul>
<h2>Commands</h2>
<ul>
<li><code>npm run dev</code> — dev server (5173)</li>
<li><code>npm run build</code> — TS check + production build</li>
<li><code>npm run lint</code> — biome check</li>
<li><code>npm run lint:ai</code> — ast-grep AI coding standards</li>
</ul>
<h2>Open questions / todo</h2>
<ul>
<li>[ ] IndexedDB migration when localStorage fills up</li>
<li>[ ] OPFS for documents if we ever need real file system access</li>
<li>[ ] Better model cache durability (separate from browser "clear cache")</li>
</ul>`,
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
