'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { 
  SerializedElement,
  EditorCanvasMode,
  BridgeSettings
} from '@webexp/shared';
import { usePreviewStore } from '@/stores/preview-store';

interface CanvasOverlayProps {
  iframe: HTMLIFrameElement | null;
  mode: EditorCanvasMode;
  onElementSelected?: (element: SerializedElement) => void;
  onElementHovered?: (element: SerializedElement | null) => void;
  onDragOperation?: (operation: unknown) => void;
  className?: string;
}

export function CanvasOverlay({
  iframe,
  mode,
  onElementSelected,
  onElementHovered,
  onDragOperation,
  className = ''
}: CanvasOverlayProps) {
  const [isSameOrigin, setIsSameOrigin] = useState<boolean | null>(null);
  const [isBridgeLoaded, setIsBridgeLoaded] = useState(false);
  const [sessionId] = useState(() => `session-${Math.random().toString(36).substr(2, 9)}`);
  const [currentHover, setCurrentHover] = useState<SerializedElement | null>(null);
  const [currentSelection, setCurrentSelection] = useState<SerializedElement | null>(null);
  
  // Check if iframe is same-origin
  useEffect(() => {
    if (!iframe) return;
    
    try {
      // Try to access contentDocument to check same-origin
      const doc = iframe.contentDocument;
      setIsSameOrigin(!!doc);
    } catch {
      setIsSameOrigin(false);
    }
  }, [iframe]);
  
  // Load bridge script for same-origin iframes
  useEffect(() => {
    if (!iframe || !isSameOrigin || isBridgeLoaded) return;
    
    const loadBridge = async () => {
      try {
        // Check if bridge is already loaded
        if (iframe.contentDocument?.getElementById('webexp-bridge-script')) {
          setIsBridgeLoaded(true);
          return;
        }
        
        // Inject bridge script
        const script = iframe.contentDocument!.createElement('script');
        script.src = '/overlay/iframe-bridge.umd.js';
        script.async = true;
        script.id = 'webexp-bridge-script';
        
        script.onload = () => {
          setIsBridgeLoaded(true);
          // Send INIT message after script loads
          setTimeout(() => sendInitMessage(), 100);
        };
        
        iframe.contentDocument!.head.appendChild(script);
      } catch (error) {
        console.error('Failed to load bridge script:', error);
        setIsSameOrigin(false);
      }
    };
    
    loadBridge();
  }, [iframe, isSameOrigin, isBridgeLoaded, sessionId]);
  
  // Send INIT message to bridge
  const sendInitMessage = useCallback(() => {
    if (!iframe?.contentWindow || !isSameOrigin) return;
    
    const settings: BridgeSettings = {
      highlightColor: '#007bff',
      containerColor: '#28a745',
      selectionColor: '#ffc107',
      enableSafeContainers: true
    };
    
    const message = {
      type: 'INIT' as const,
      sessionId,
      parentOrigin: window.location.origin,
      mode,
      settings
    };
    
    try {
      iframe.contentWindow.postMessage(message, iframe.src);
    } catch (error) {
      console.error('Failed to send INIT message:', error);
    }
  }, [iframe, isSameOrigin, mode, sessionId]);
  
  // Get preview store
  const { addOp, reapplyPreview } = usePreviewStore();
  
  // Reapply preview operations on iframe navigation
  useEffect(() => {
    if (!iframe || !isSameOrigin) return;
    
    const handleIframeLoad = () => {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        reapplyPreview();
      }, 100);
    };
    
    iframe.addEventListener('load', handleIframeLoad);
    return () => iframe.removeEventListener('load', handleIframeLoad);
  }, [iframe, isSameOrigin, reapplyPreview]);
  
  // Listen for bridge messages
  useEffect(() => {
    if (!isBridgeLoaded) return;
    
    const handleMessage = (event: MessageEvent) => {
      // Validate origin and session
      if (event.origin !== new URL(iframe?.src || '').origin) return;
      if (event.data?.sessionId !== sessionId) return;
      
      const { type, element, operation } = event.data;
      
      switch (type) {
        case 'HOVER':
          setCurrentHover(element);
          onElementHovered?.(element);
          break;
        case 'SELECT':
          setCurrentSelection(element);
          onElementSelected?.(element);
          break;
        case 'DRAG_END':
          if (operation) {
            // Convert bridge operation to draft operation
            if (operation.type === 'move' && operation.source && operation.target) {
              addOp({
                type: 'move',
                selector: operation.source,
                targetSelector: operation.target.selector,
                position: operation.target.position
              });
            }
            onDragOperation?.(operation);
          }
          break;
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isBridgeLoaded, iframe, sessionId, onElementHovered, onElementSelected, onDragOperation, addOp]);
  
  // Re-initialize bridge when mode changes
  useEffect(() => {
    if (isBridgeLoaded && iframe?.contentWindow) {
      sendInitMessage();
    }
  }, [mode, isBridgeLoaded, sendInitMessage]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (iframe?.contentWindow && isSameOrigin) {
        // Send cleanup message if possible
        try {
          iframe.contentWindow.postMessage({
            type: 'CLEANUP',
            sessionId
          }, iframe.src);
        } catch {
          // Ignore cleanup errors
        }
      }
    };
  }, [iframe, isSameOrigin, sessionId]);
  
  // Render cross-origin fallback
  if (isSameOrigin === false) {
    return (
      <div className={`cross-origin-fallback ${className}`}>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 m-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Cross-origin preview detected
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Use WebExp browser extension or bookmarklet to edit this page.
                </p>
                <p className="mt-1">
                  <button className="underline hover:no-underline">
                    Learn more about cross-origin editing
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Render loading state
  if (isSameOrigin && !isBridgeLoaded) {
    return (
      <div className={`bridge-loading ${className}`}>
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600">Loading editor bridge...</span>
        </div>
      </div>
    );
  }
  
  // Bridge is loaded and ready - render minimal overlay for debugging
  return (
    <div className={`canvas-overlay ${className}`}>
      {currentHover && (
        <div className="text-xs text-gray-500 p-2 bg-white border rounded shadow-sm">
          Hover: {currentHover.metadata.tagName}
          {currentHover.metadata.id && `#${currentHover.metadata.id}`}
          {currentHover.metadata.classes.length > 0 && `.${currentHover.metadata.classes.join('.')}`}
        </div>
      )}
      
      {currentSelection && (
        <div className="text-xs text-gray-500 p-2 bg-white border rounded shadow-sm mt-2">
          Selected: {currentSelection.metadata.tagName}
          {currentSelection.metadata.id && `#${currentSelection.metadata.id}`}
          {currentSelection.metadata.classes.length > 0 && `.${currentSelection.metadata.classes.join('.')}`}
        </div>
      )}
    </div>
  );
}
