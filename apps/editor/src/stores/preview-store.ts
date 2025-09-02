import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface DraftOperation {
  id: string;
  type: 'move' | 'text' | 'class' | 'attribute' | 'style';
  selector: string;
  value?: string;
  targetSelector?: string;
  position?: 'before' | 'after' | 'append';
  timestamp: number;
}

interface PreviewState {
  // Draft operations for live preview
  draftOps: DraftOperation[];
  
  // Preview state
  isLiveMode: boolean;
  isApplying: boolean;
  lastApplied: number;
  
  // Actions
  addOp: (op: Omit<DraftOperation, 'id' | 'timestamp'>) => void;
  removeOp: (id: string) => void;
  updateOp: (id: string, updates: Partial<DraftOperation>) => void;
  clearOps: () => void;
  
  // Live preview
  setLiveMode: (enabled: boolean) => void;
  applyDraftOpsToIframe: (iframe: HTMLIFrameElement) => Promise<void>;
  reapplyPreview: () => Promise<void>;
}

export const usePreviewStore = create<PreviewState>()(
  devtools(
    (set, get) => ({
      // Initial state
      draftOps: [],
      isLiveMode: true,
      isApplying: false,
      lastApplied: 0,
      
      // Add a new draft operation
      addOp: (op) => {
        const draftOp: DraftOperation = {
          id: `draft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          ...op
        };
        
        set((state) => ({
          draftOps: [...state.draftOps, draftOp]
        }));
        
        // Auto-apply if live mode is enabled
        if (get().isLiveMode) {
          // Find the iframe in the DOM
          const iframe = document.querySelector('iframe');
          if (iframe) {
            get().applyDraftOpsToIframe(iframe);
          }
        }
      },
      
      // Remove a draft operation
      removeOp: (id) => {
        set((state) => ({
          draftOps: state.draftOps.filter(op => op.id !== id)
        }));
        
        // Re-apply remaining ops
        if (get().isLiveMode) {
          const iframe = document.querySelector('iframe');
          if (iframe) {
            get().applyDraftOpsToIframe(iframe);
          }
        }
      },
      
      // Update a draft operation
      updateOp: (id, updates) => {
        set((state) => ({
          draftOps: state.draftOps.map(op => 
            op.id === id ? { ...op, ...updates } : op
          )
        }));
        
        // Re-apply if live mode is enabled
        if (get().isLiveMode) {
          const iframe = document.querySelector('iframe');
          if (iframe) {
            get().applyDraftOpsToIframe(iframe);
          }
        }
      },
      
      // Clear all draft operations
      clearOps: () => {
        set({ draftOps: [] });
      },
      
      // Set live mode
      setLiveMode: (enabled) => {
        set({ isLiveMode: enabled });
      },
      
      // Apply draft operations to iframe
      applyDraftOpsToIframe: async (iframe) => {
        const state = get();
        if (state.draftOps.length === 0) return;
        
        set({ isApplying: true });
        
        try {
          // Wait for iframe to be ready
          if (!iframe.contentDocument || !iframe.contentDocument.body) {
            console.warn('Iframe not ready for preview application');
            return;
          }
          
          // Convert draft operations to patch-engine operations
          const operations = state.draftOps.map(draftOp => {
            switch (draftOp.type) {
              case 'move':
                if (draftOp.targetSelector && draftOp.position) {
                  switch (draftOp.position) {
                    case 'before':
                      return {
                        op: 'moveBefore',
                        selector: draftOp.selector,
                        targetSelector: draftOp.targetSelector
                      };
                    case 'after':
                      return {
                        op: 'moveAfter',
                        selector: draftOp.selector,
                        targetSelector: draftOp.targetSelector
                      };
                    case 'append':
                      return {
                        op: 'appendTo',
                        selector: draftOp.selector,
                        containerSelector: draftOp.targetSelector
                      };
                  }
                }
                break;
                
              case 'text':
                return {
                  op: 'textReplace',
                  selector: draftOp.selector,
                  value: draftOp.value || ''
                };
                
              case 'class':
                return {
                  op: 'classAdd',
                  selector: draftOp.selector,
                  value: draftOp.value || ''
                };
                
              case 'attribute':
                return {
                  op: 'attrSet',
                  selector: draftOp.selector,
                  name: draftOp.value || '',
                  value: draftOp.value || ''
                };
                
              case 'style':
                return {
                  op: 'styleSet',
                  selector: draftOp.selector,
                  property: draftOp.value || '',
                  value: draftOp.value || ''
                };
            }
            
            return null;
          }).filter(Boolean);
          
          // Apply operations using patch-engine
          if (operations.length > 0) {
            // Import patch-engine dynamically to avoid circular dependencies
            const { applyOperations } = await import('@webexp/patch-engine');
            
            await applyOperations(iframe.contentDocument, operations);
            
            set({ 
              lastApplied: Date.now(),
              isApplying: false 
            });
            
            console.log(`Applied ${operations.length} preview operations`);
          }
        } catch (error) {
          console.error('Failed to apply preview operations:', error);
          set({ isApplying: false });
        }
      },
      
      // Reapply preview operations
      reapplyPreview: async () => {
        const iframe = document.querySelector('iframe');
        if (iframe) {
          await get().applyDraftOpsToIframe(iframe);
        }
      }
    }),
    {
      name: 'preview-store'
    }
  )
);
