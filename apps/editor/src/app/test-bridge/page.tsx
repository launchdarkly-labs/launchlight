'use client';

import React, { useRef, useState } from 'react';
import { CanvasOverlay } from '@/components/canvas/CanvasOverlay';
import type { SerializedElement, EditorCanvasMode } from '@webexp/shared';

export default function TestBridgePage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mode, setMode] = useState<EditorCanvasMode>('select');
  const [selectedElement, setSelectedElement] = useState<SerializedElement | null>(null);
  const [hoveredElement, setHoveredElement] = useState<SerializedElement | null>(null);
  const [dragOperation, setDragOperation] = useState<unknown>(null);

  const handleElementSelected = (element: SerializedElement) => {
    setSelectedElement(element);
    console.log('Element selected:', element);
  };

  const handleElementHovered = (element: SerializedElement | null) => {
    setHoveredElement(element);
    if (element) {
      console.log('Element hovered:', element);
    }
  };

  const handleDragOperation = (operation: unknown) => {
    setDragOperation(operation);
    console.log('Drag operation:', operation);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b bg-background">
        <h1 className="text-2xl font-bold">Bridge Test Page</h1>
        <p className="text-muted-foreground">Test the secure canvas bridge functionality</p>
        
        {/* Mode Controls */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setMode('select')}
            className={`px-3 py-1 rounded text-sm ${
              mode === 'select' ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}
          >
            Select Mode
          </button>
          <button
            onClick={() => setMode('drag')}
            className={`px-3 py-1 rounded text-sm ${
              mode === 'drag' ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}
          >
            Drag Mode
          </button>
          <button
            onClick={() => setMode('preview')}
            className={`px-3 py-1 rounded text-sm ${
              mode === 'preview' ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}
          >
            Preview Mode
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Controls */}
        <div className="w-80 border-r bg-muted/20 p-4">
          <h2 className="text-lg font-semibold mb-4">Bridge Status</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-sm">Current Mode</h3>
              <p className="text-sm text-muted-foreground">{mode}</p>
            </div>
            
            {selectedElement && (
              <div>
                <h3 className="font-medium text-sm">Selected Element</h3>
                <div className="text-xs bg-background p-2 rounded border">
                  <p><strong>Tag:</strong> {selectedElement.metadata.tagName}</p>
                  <p><strong>Selector:</strong> {selectedElement.selector}</p>
                  <p><strong>Classes:</strong> {selectedElement.metadata.classes.join(', ') || 'none'}</p>
                  <p><strong>Container Safe:</strong> {selectedElement.containerSafe ? 'Yes' : 'No'}</p>
                  <p><strong>Can Drag:</strong> {selectedElement.canDrag ? 'Yes' : 'No'}</p>
                </div>
              </div>
            )}
            
            {hoveredElement && (
              <div>
                <h3 className="font-medium text-sm">Hovered Element</h3>
                <div className="text-xs bg-background p-2 rounded border">
                  <p><strong>Tag:</strong> {hoveredElement.metadata.tagName}</p>
                  <p><strong>Selector:</strong> {hoveredElement.selector}</p>
                </div>
              </div>
            )}
            
            {dragOperation && (
              <div>
                <h3 className="font-medium text-sm">Last Drag Operation</h3>
                <div className="text-xs bg-background p-2 rounded border">
                  <pre>{JSON.stringify(dragOperation, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Center Panel - Preview */}
        <div className="flex-1 overflow-hidden relative">
          <iframe
            ref={iframeRef}
            src="/test-page.html"
            className="w-full h-full border-0"
            onLoad={() => console.log('Test iframe loaded')}
          />
          
          <CanvasOverlay
            iframe={iframeRef.current}
            mode={mode}
            onElementSelected={handleElementSelected}
            onElementHovered={handleElementHovered}
            onDragOperation={handleDragOperation}
          />
        </div>
      </div>
    </div>
  );
}
