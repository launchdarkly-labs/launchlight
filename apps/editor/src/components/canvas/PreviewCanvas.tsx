'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CanvasOverlay } from './CanvasOverlay';
import { 
  RefreshCw, 
  Monitor, 
  Tablet, 
  Smartphone, 
  Eye, 
  MousePointer, 
  Move, 
  Edit3,
  ExternalLink,
  Settings
} from 'lucide-react';
import type { 
  SerializedElement,
  EditorCanvasMode
} from '@webexp/shared';

interface PreviewCanvasProps {
  url: string;
  onUrlChange: (url: string) => void;
  onElementSelected?: (element: SerializedElement) => void;
  onDragOperation?: (operation: unknown) => void;
  className?: string;
}

type DeviceSize = 'desktop' | 'tablet' | 'mobile';

const DEVICE_SIZES = {
  desktop: { width: '100%', height: '100%', label: 'Desktop' },
  tablet: { width: '768px', height: '1024px', label: 'Tablet' },
  mobile: { width: '375px', height: '667px', label: 'Mobile' }
};

export function PreviewCanvas({
  url,
  onUrlChange,
  onElementSelected,
  onDragOperation,
  className = ''
}: PreviewCanvasProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [currentUrl, setCurrentUrl] = useState(url);
  const [isLoading, setIsLoading] = useState(false);
  const [deviceSize, setDeviceSize] = useState<DeviceSize>('desktop');
  const [canvasMode, setCanvasMode] = useState<EditorCanvasMode>('select');
  const [selectedElement, setSelectedElement] = useState<SerializedElement | null>(null);
  const [hoveredElement, setHoveredElement] = useState<SerializedElement | null>(null);

  // Handle URL change
  const handleUrlSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (currentUrl !== url) {
      onUrlChange(currentUrl);
    }
  }, [currentUrl, url, onUrlChange]);

  // Handle iframe load
  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
    try {
      const href = iframeRef.current?.contentWindow?.location.href;
      console.log('[Preview] Iframe loaded:', href);
    } catch (error) {
      // Cross-origin access blocked - this is expected for external sites
      console.log('[Preview] Iframe loaded (cross-origin, href access blocked)');
    }
  }, []);

  // Refresh iframe
  const handleRefresh = useCallback(() => {
    if (iframeRef.current) {
      setIsLoading(true);
      iframeRef.current.src = url;
    }
  }, [url]);

  // Handle element selection
  const handleElementSelected = useCallback((element: SerializedElement) => {
    setSelectedElement(element);
    onElementSelected?.(element);
  }, [onElementSelected]);

  // Handle element hover
  const handleElementHovered = useCallback((element: SerializedElement | null) => {
    setHoveredElement(element);
  }, []);

  // Handle drag operation
  const handleDragOperation = useCallback((operation: unknown) => {
    console.log('[Preview] Drag operation:', operation);
    onDragOperation?.(operation);
  }, [onDragOperation]);

  // Update iframe when URL changes
  useEffect(() => {
    if (iframeRef.current && url) {
      setIsLoading(true);
      iframeRef.current.src = url;
      setCurrentUrl(url);
    }
  }, [url]);

  const deviceConfig = DEVICE_SIZES[deviceSize];

  return (
    <div className={`flex flex-col h-full bg-background ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-3 border-b bg-muted/50">
        {/* URL Bar */}
        <form onSubmit={handleUrlSubmit} className="flex-1 flex items-center gap-2">
          <Input
            value={currentUrl}
            onChange={(e) => setCurrentUrl(e.target.value)}
            placeholder="Enter preview URL..."
            className="flex-1"
          />
          <Button type="submit" size="sm" variant="outline">
            <ExternalLink className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </form>

        {/* Device Size Selector */}
        <div className="flex items-center gap-1 border rounded-md p-1">
          <Button
            size="sm"
            variant={deviceSize === 'desktop' ? 'default' : 'ghost'}
            onClick={() => setDeviceSize('desktop')}
            className="h-8 px-2"
          >
            <Monitor className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant={deviceSize === 'tablet' ? 'default' : 'ghost'}
            onClick={() => setDeviceSize('tablet')}
            className="h-8 px-2"
          >
            <Tablet className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant={deviceSize === 'mobile' ? 'default' : 'ghost'}
            onClick={() => setDeviceSize('mobile')}
            className="h-8 px-2"
          >
            <Smartphone className="w-4 h-4" />
          </Button>
        </div>

        {/* Canvas Mode Selector */}
        <div className="flex items-center gap-1 border rounded-md p-1">
          <Button
            size="sm"
            variant={canvasMode === 'preview' ? 'default' : 'ghost'}
            onClick={() => setCanvasMode('preview')}
            className="h-8 px-2"
            title="Preview Mode"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant={canvasMode === 'select' ? 'default' : 'ghost'}
            onClick={() => setCanvasMode('select')}
            className="h-8 px-2"
            title="Select Mode"
          >
            <MousePointer className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant={canvasMode === 'drag' ? 'default' : 'ghost'}
            onClick={() => setCanvasMode('drag')}
            className="h-8 px-2"
            title="Drag Mode"
          >
            <Move className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant={canvasMode === 'edit' ? 'default' : 'ghost'}
            onClick={() => setCanvasMode('edit')}
            className="h-8 px-2"
            title="Edit Mode"
          >
            <Edit3 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Device Info Bar */}
      {deviceSize !== 'desktop' && (
        <div className="flex items-center justify-center gap-2 py-2 px-3 bg-muted text-muted-foreground text-sm border-b">
          <span>{deviceConfig.label}</span>
          <Badge variant="outline" className="text-xs">
            {deviceConfig.width} × {deviceConfig.height}
          </Badge>
        </div>
      )}

      {/* Element Info Bar */}
      {(selectedElement || hoveredElement) && (
        <div className="flex items-center gap-2 py-2 px-3 bg-blue-50 border-b text-sm">
          <div className="flex items-center gap-2">
            {selectedElement && (
              <Badge variant="default" className="text-xs">
                Selected: {selectedElement.metadata.tagName}
                {selectedElement.metadata.classes.length > 0 && (
                  <span className="ml-1 opacity-80">
                    .{selectedElement.metadata.classes.slice(0, 2).join('.')}
                  </span>
                )}
              </Badge>
            )}
            {hoveredElement && hoveredElement !== selectedElement && (
              <Badge variant="outline" className="text-xs">
                Hover: {hoveredElement.metadata.tagName}
              </Badge>
            )}
          </div>
          {selectedElement && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {selectedElement.containerSafe && <span>📦 Safe Container</span>}
              {selectedElement.canDrag && <span>🔄 Draggable</span>}
              {selectedElement.selectorUnique && <span>🎯 Unique Selector</span>}
            </div>
          )}
        </div>
      )}

      {/* Preview Area */}
      <div className="flex-1 flex items-center justify-center bg-gray-100 p-4">
        <div
          className="relative bg-white shadow-lg rounded-lg overflow-hidden transition-all duration-300"
          style={{
            width: deviceConfig.width === '100%' ? '100%' : deviceConfig.width,
            height: deviceConfig.height === '100%' ? '100%' : deviceConfig.height,
            maxWidth: '100%',
            maxHeight: '100%'
          }}
        >
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-50">
              <div className="flex items-center gap-2 text-muted-foreground">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Loading preview...</span>
              </div>
            </div>
          )}

          {/* Preview Iframe */}
          <iframe
            ref={iframeRef}
            src={url}
            onLoad={handleIframeLoad}
            className="w-full h-full border-0"
            style={{
              pointerEvents: canvasMode === 'preview' ? 'auto' : 'none'
            }}
            title="Preview"
          />

          {/* Canvas Overlay */}
          <CanvasOverlay
            iframe={iframeRef.current}
            mode={canvasMode}
            onElementSelected={handleElementSelected}
            onElementHovered={handleElementHovered}
            onDragOperation={handleDragOperation}
          />
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between py-2 px-3 border-t bg-muted/50 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>Mode: {canvasMode}</span>
          <span>Device: {deviceConfig.label}</span>
          {url && <span>URL: {new URL(url).hostname}</span>}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">
            <Settings className="w-3 h-3 mr-1" />
            Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
