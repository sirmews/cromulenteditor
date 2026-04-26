import {
  env,
  type ProgressCallback,
  pipeline
} from '@huggingface/transformers';
import type { ChatMessage } from '@/lib/ai';

env.allowLocalModels = false;
env.useBrowserCache = true;

export type ModelStatus = 'idle' | 'downloading' | 'ready' | 'error';
export type ModelDtype = 'q1' | 'q2' | 'q4';

interface DtypeInfo {
  label: string;
  size: string;
}

export const DTYPE_INFO: Record<ModelDtype, DtypeInfo> = {
  q1: { label: 'Q1 (fastest)', size: '~277 MB' },
  q2: { label: 'Q2 (balanced)', size: '~482 MB' },
  q4: { label: 'Q4 (best quality)', size: '~1.0 GB' }
};

const MODEL_ID = 'onnx-community/Bonsai-1.7B-ONNX';

type TextGenerationPipeline = Awaited<
  ReturnType<typeof pipeline<'text-generation'>>
>;

let generator: TextGenerationPipeline | null = null;
let loadPromise: Promise<void> | null = null;
let currentDtype: ModelDtype = 'q1';

export async function checkWebGPU(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('gpu' in navigator)) return false;
  try {
    // WebGPU types are not universally available in TypeScript DOM libs.
    // ast-grep-ignore: no-any-in-lib
    const adapter = await (navigator as any).gpu.requestAdapter();
    return !!adapter;
  } catch {
    return false;
  }
}

export function getModelDtype(): ModelDtype {
  return currentDtype;
}

export function setModelDtype(dtype: ModelDtype): void {
  if (dtype !== currentDtype) {
    currentDtype = dtype;
    // Reset the generator so the next call downloads the new variant.
    // Different dtypes are stored in separate cache entries, so the old
    // cached files remain available if the user switches back.
    generator = null;
    loadPromise = null;
  }
}

export async function loadModel(onProgress?: ProgressCallback): Promise<void> {
  if (generator) return;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      const hasWebGPU = await checkWebGPU();

      generator = await pipeline('text-generation', MODEL_ID, {
        device: hasWebGPU ? 'webgpu' : 'wasm',
        dtype: currentDtype,
        progress_callback: onProgress
      });
    } catch (err) {
      // Reset so the next call can retry
      loadPromise = null;
      throw err;
    }
  })();

  return loadPromise;
}

interface GeneratedMessage {
  role: string;
  content: string;
}

export async function generate(messages: ChatMessage[]): Promise<string> {
  await loadModel();

  if (!generator) {
    throw new Error('Model generator failed to initialize');
  }

  const result = await generator(messages, {
    max_new_tokens: 512,
    do_sample: false
  });

  const output = Array.isArray(result) ? result[0] : result;

  // When using message arrays, generated_text is an array of message objects
  // The last element is the assistant's response
  const generatedMessages = output.generated_text as GeneratedMessage[];
  const lastMessage = generatedMessages.at(-1);

  if (lastMessage && lastMessage.role === 'assistant') {
    return lastMessage.content.trim();
  }

  // Fallback: if something went wrong, return the raw text
  return String(output.generated_text).trim();
}

export function isModelLoaded(): boolean {
  return generator !== null;
}

export async function clearModels(): Promise<void> {
  const cacheNames = await caches.keys();
  for (const name of cacheNames) {
    if (name.includes('transformers-cache')) {
      await caches.delete(name);
    }
  }
  generator = null;
  loadPromise = null;
}
