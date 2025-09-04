import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { 
  WebExpPayloadV1, 
  WebExpOp, 
  ValidationResult 
} from '@webexp/patch-engine';
import type {
  SerializedElement
} from '@webexp/shared';
import { 
  validatePayload
} from '@webexp/patch-engine';
import { toast } from '@/hooks/use-toast';

interface ExperimentHistory {
  past: WebExpPayloadV1[];
  present: WebExpPayloadV1;
  future: WebExpPayloadV1[];
}

interface ExperimentState {
  // Current experiment data
  flagKey: string | null;
  flagName: string | null;
  currentPayload: WebExpPayloadV1;
  selectedVariation: string | null;
  
  // UI state
  selectedElement: SerializedElement | null;
  previewUrl: string;
  isDirty: boolean;
  isPublishing: boolean;
  
  // History for undo/redo
  history: ExperimentHistory;
  
  // Validation
  validation: ValidationResult | null;
  
  // Actions
  setFlagKey: (flagKey: string) => void;
  setFlagName: (name: string) => void;
  setSelectedVariation: (variation: string) => void;
  setSelectedElement: (element: SerializedElement | null) => void;
  setPreviewUrl: (url: string) => void;
  
  // Payload operations
  addOperation: (operation: WebExpOp) => void;
  removeOperation: (index: number) => void;
  updateOperation: (index: number, operation: WebExpOp) => void;
  reorderOperations: (startIndex: number, endIndex: number) => void;
  toggleOperation: (index: number) => void;
  clearOperations: () => void;
  
  // History management
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  
  // Payload management
  loadPayload: (payload: WebExpPayloadV1) => void;
  resetPayload: () => void;
  validateCurrentPayload: () => ValidationResult;
  
  // Persistence
  loadExperiment: (flagKey: string) => Promise<void>;
  saveExperiment: () => Promise<void>;
  publishExperiment: () => Promise<void>;
}

const createInitialHistory = (payload: WebExpPayloadV1): ExperimentHistory => ({
  past: [],
  present: payload,
  future: []
});

const addToHistory = (
  history: ExperimentHistory, 
  newPayload: WebExpPayloadV1
): ExperimentHistory => ({
  past: [...history.past, history.present].slice(-50), // Keep last 50 states
  present: newPayload,
  future: [] // Clear future when new change is made
});

const undoHistory = (history: ExperimentHistory): ExperimentHistory => {
  if (history.past.length === 0) return history;
  
  const previous = history.past[history.past.length - 1];
  const newPast = history.past.slice(0, -1);
  
  return {
    past: newPast,
    present: previous,
    future: [history.present, ...history.future]
  };
};

const redoHistory = (history: ExperimentHistory): ExperimentHistory => {
  if (history.future.length === 0) return history;
  
  const next = history.future[0];
  const newFuture = history.future.slice(1);
  
  return {
    past: [...history.past, history.present],
    present: next,
    future: newFuture
  };
};

function getProjectEnvKeys() {
  const projectKey = process.env.NEXT_PUBLIC_LD_PROJECT_KEY || '';
  const envKey = process.env.NEXT_PUBLIC_LD_ENV_KEY || '';
  return { projectKey, envKey };
}

export const useExperimentStore = create<ExperimentState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        flagKey: null,
        flagName: null,
        currentPayload: { version: 1, ops: [] },
        selectedVariation: null,
        selectedElement: null,
        previewUrl: process.env.NEXT_PUBLIC_SAMPLE_SITE_URL || 'http://localhost:3001',
        isDirty: false,
        isPublishing: false,
        history: createInitialHistory({ version: 1, ops: [] }),
        validation: null,

        // Basic setters
        setFlagKey: (flagKey) => set({ flagKey }),
        setFlagName: (flagName) => set({ flagName }),
        setSelectedVariation: (selectedVariation) => set({ selectedVariation }),
        setSelectedElement: (selectedElement) => set({ selectedElement }),
        setPreviewUrl: (previewUrl) => set({ previewUrl }),

        // Operation management
        addOperation: (operation) => {
          const state = get();
          const newPayload = {
            ...state.currentPayload,
            ops: [...state.currentPayload.ops, operation]
          };
          
          const newHistory = addToHistory(state.history, newPayload);
          const validation = validatePayload(newPayload);
          
          set({
            currentPayload: newPayload,
            history: newHistory,
            isDirty: true,
            validation: validation.success ? null : {
              valid: false,
              errors: [{ path: 'root', message: validation.error?.message || 'Invalid payload', severity: 'error' as const }]
            }
          });
        },

        removeOperation: (index) => {
          const state = get();
          const newOps = state.currentPayload.ops.filter((_, i) => i !== index);
          const newPayload = {
            ...state.currentPayload,
            ops: newOps
          };
          
          const newHistory = addToHistory(state.history, newPayload);
          
          set({
            currentPayload: newPayload,
            history: newHistory,
            isDirty: true
          });
        },

        updateOperation: (index, operation) => {
          const state = get();
          const newOps = [...state.currentPayload.ops];
          newOps[index] = operation;
          
          const newPayload = {
            ...state.currentPayload,
            ops: newOps
          };
          
          const newHistory = addToHistory(state.history, newPayload);
          
          set({
            currentPayload: newPayload,
            history: newHistory,
            isDirty: true
          });
        },

        reorderOperations: (startIndex, endIndex) => {
          const state = get();
          const newOps = [...state.currentPayload.ops];
          const [removed] = newOps.splice(startIndex, 1);
          newOps.splice(endIndex, 0, removed);
          
          const newPayload = {
            ...state.currentPayload,
            ops: newOps
          };
          
          const newHistory = addToHistory(state.history, newPayload);
          
          set({
            currentPayload: newPayload,
            history: newHistory,
            isDirty: true
          });
        },

        toggleOperation: (index) => {
          const state = get();
          // UI-only placeholder
          console.log(`Toggling operation ${index} (UI only)`);
        },

        clearOperations: () => {
          const state = get();
          const newPayload = {
            ...state.currentPayload,
            ops: []
          };
          
          const newHistory = addToHistory(state.history, newPayload);
          
          set({
            currentPayload: newPayload,
            history: newHistory,
            isDirty: true
          });
        },

        // History management
        undo: () => {
          const state = get();
          const newHistory = undoHistory(state.history);
          
          set({
            currentPayload: newHistory.present,
            history: newHistory,
            isDirty: true
          });
        },

        redo: () => {
          const state = get();
          const newHistory = redoHistory(state.history);
          
          set({
            currentPayload: newHistory.present,
            history: newHistory,
            isDirty: true
          });
        },

        canUndo: () => {
          const state = get();
          return state.history.past.length > 0;
        },

        canRedo: () => {
          const state = get();
          return state.history.future.length > 0;
        },

        // Payload management
        loadPayload: (payload) => {
          const validation = validatePayload(payload);
          
          set({
            currentPayload: payload,
            history: createInitialHistory(payload),
            isDirty: false,
            validation: validation.success ? null : {
              valid: false,
              errors: [{ path: 'root', message: validation.error?.message || 'Invalid payload', severity: 'error' as const }]
            }
          });
        },

        resetPayload: () => {
          const emptyPayload = { version: 1 as const, ops: [] };
          set({
            currentPayload: emptyPayload,
            history: createInitialHistory(emptyPayload),
            isDirty: false,
            validation: null
          });
        },

        validateCurrentPayload: () => {
          const state = get();
          const schemaValidation = validatePayload(state.currentPayload);
          
          if (!schemaValidation.success) {
            return {
              valid: false,
              errors: [{ 
                path: 'root', 
                message: schemaValidation.error?.message || 'Invalid payload structure', 
                severity: 'error' as const 
              }]
            };
          }

          const errors: ValidationResult['errors'] = [];
          
          // Size validation
          const jsonSize = JSON.stringify(state.currentPayload).length;
          const estimatedGzipSize = jsonSize * 0.3; // Rough estimate
          const maxSize = 20 * 1024; // 20KB
          
          if (estimatedGzipSize > maxSize) {
            errors.push({
              path: 'root',
              message: `Payload too large: ~${Math.ceil(estimatedGzipSize / 1024)}KB (max 20KB)`,
              severity: 'error' as const
            });
          } else if (estimatedGzipSize > maxSize * 0.8) {
            errors.push({
              path: 'root',
              message: `Payload size warning: ~${Math.ceil(estimatedGzipSize / 1024)}KB (approaching limit)`,
              severity: 'warning' as const
            });
          }

          const result: ValidationResult = {
            valid: errors.filter(e => e.severity === 'error').length === 0,
            errors,
            sizeInfo: {
              jsonSize,
              gzippedSize: estimatedGzipSize
            }
          };

          set({ validation: result });
          return result;
        },

        // Persistence (mock implementation)
        loadExperiment: async (flagKey) => {
          console.log(`Loading experiment: ${flagKey}`);
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const mockPayload: WebExpPayloadV1 = {
            version: 1,
            ops: [],
            meta: {
              note: `Experiment for flag: ${flagKey}`
            }
          };
          
          set({
            flagKey,
            flagName: `Experiment: ${flagKey}`,
            selectedVariation: 'control',
            currentPayload: mockPayload,
            history: createInitialHistory(mockPayload),
            isDirty: false,
            validation: null
          });
        },

        saveExperiment: async () => {
          const state = get();
          console.log('Saving experiment:', state.currentPayload);
          
          await new Promise(resolve => setTimeout(resolve, 500));
          
          set({ isDirty: false });
        },

        publishExperiment: async () => {
          const state = get();
          const { flagKey, selectedVariation, currentPayload } = state;
          
          if (!flagKey || !selectedVariation) {
            toast({ title: 'Missing configuration', description: 'Select a flag and variation before publishing.' });
            return;
          }
          
          const validation = get().validateCurrentPayload();
          if (!validation.valid) {
            toast({ title: 'Invalid payload', description: 'Fix validation errors before publishing.' });
            return;
          }

          const { projectKey, envKey } = getProjectEnvKeys();
          if (!projectKey || !envKey) {
            toast({ title: 'Missing project/environment', description: 'Set NEXT_PUBLIC_LD_PROJECT_KEY and NEXT_PUBLIC_LD_ENV_KEY.' });
            return;
          }

          set({ isPublishing: true });
          try {
            const res = await fetch(`/api/flags/${encodeURIComponent(projectKey)}/${encodeURIComponent(envKey)}/${encodeURIComponent(flagKey)}/publish`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                variationKey: selectedVariation,
                payload: { type: 'webexp', ops: currentPayload.ops },
                meta: { note: state.flagName || '' },
                actor: 'editor-user'
              })
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) {
              throw new Error(json?.detail || 'Publish failed');
            }

            toast({ title: 'Published', description: `Mode: ${json.mode || 'inline'}${json.checksum ? ` • checksum ${json.checksum}` : ''}` });
            set({ isDirty: false });
          } catch (e: any) {
            console.error('Publish failed:', e);
            toast({ title: 'Publish error', description: e?.message || 'Unknown error' });
          } finally {
            set({ isPublishing: false });
          }
        }
      }),
      {
        name: 'experiment-store',
        partialize: (state) => ({
          // Only persist essential data
          flagKey: state.flagKey,
          flagName: state.flagName,
          currentPayload: state.currentPayload,
          selectedVariation: state.selectedVariation,
          previewUrl: state.previewUrl,
          history: state.history
        })
      }
    ),
    {
      name: 'experiment-store'
    }
  )
);
