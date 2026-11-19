import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let loadedKnowledge = '';
let loadError = null;
let loadPromise = null;

const loadKnowledgeModule = async () => {
  const mod = await import('../chat/cafeKnowledge.js');
  return typeof mod.getCafeKnowledge === 'function'
    ? mod.getCafeKnowledge()
    : String(mod.cafeKnowledge || '');
};

export const ensureCafeKnowledgeLoaded = async () => {
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      loadedKnowledge = await loadKnowledgeModule();
    } catch (error) {
      loadError = error;
      loadedKnowledge = '';
    }

    if (!loadedKnowledge.trim()) {
      console.warn(
        'Chat knowledge file is empty or could not be loaded. Chat will still work, but it will not have the approved café reference text.'
      );
    }
  })();

  return loadPromise;
};

export const loadCafeKnowledge = () => {
  // If startup loading has not completed yet, return whatever is loaded so far.
  // The chat route still works; it just may not have the knowledge text on the very
  // first request if the server is queried before startup finishes.
  return loadedKnowledge;
};

export const getCafeKnowledge = () => loadedKnowledge;
export const getCafeKnowledgeLoadError = () => loadError;
