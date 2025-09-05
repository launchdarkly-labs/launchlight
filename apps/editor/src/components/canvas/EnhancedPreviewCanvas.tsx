'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
  Settings,
  Play,
  Pause,
  Camera,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download
} from 'lucide-react';
import { 
  PreviewManager,
  DEVICE_PRESETS,
  type DeviceSimulation,
  type PerformanceMetrics 
} from '@/lib/preview-manager';
import { 
  type SerializedElement,
  type EditorCanvasMode
} from '@webexp/shared';
import { useExperimentStore } from '@/stores/experiment-store';

interface EnhancedPreviewCanvasProps {
  url: string;
  onUrlChange: (url: string) => void;
  onElementSelected?: (element: SerializedElement) => void;
  onDragOperation?: (operation: unknown) => void;
  className?: string;
}

export function EnhancedPreviewCanvas({
  url,
  onUrlChange,
  onElementSelected,
  onDragOperation,
  className = ''
}: EnhancedPreviewCanvasProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const previewManagerRef = useRef<PreviewManager | null>(null);
  
  const [currentUrl, setCurrentUrl] = useState(url);
  const [isLoading, setIsLoading] = useState(false);
  const [devicePreset, setDevicePreset] = useState<string>('desktop');
  const [canvasMode, setCanvasMode] = useState<EditorCanvasMode>('select');
  const [selectedElement, setSelectedElement] = useState<SerializedElement | null>(null);
  const [hoveredElement, setHoveredElement] = useState<SerializedElement | null>(null);
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [autoApply, setAutoApply] = useState(false);
  const [performance, setPerformance] = useState<PerformanceMetrics>({
    operationCount: 0,
    renderTime: 0,
    memoryUsage: 0,
    warnings: []
  });

  const { currentPayload } = useExperimentStore();

  // Initialize preview manager
  useEffect(() => {
    if (iframeRef.current && !previewManagerRef.current) {
      const manager = new PreviewManager();
      previewManagerRef.current = manager;
      
      manager.initialize(iframeRef.current);
      manager.setLiveMode(isLiveMode);
      
      // Setup event listeners
      manager.on('performanceUpdate', ({ metrics }) => {
        setPerformance(metrics);
      });
      
      manager.on('error', ({ message, operation }) => {
        console.error('Preview error:', message, operation);
      });
      
      manager.on('operationApplied', ({ operation, success, error }) => {
        console.log('Operation applied:', operation.op, success, error);
      });
      
      return () => {
        manager.destroy();
        previewManagerRef.current = null;
      };
    }
  }, [isLiveMode]);

  // Apply operations when payload changes and auto-apply is enabled
  useEffect(() => {
    if (autoApply && previewManagerRef.current && currentPayload.ops.length > 0) {
      previewManagerRef.current.applyPayload(currentPayload);
    }
  }, [currentPayload, autoApply]);

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
    
    // Auto-apply operations if enabled
    if (autoApply && previewManagerRef.current && currentPayload.ops.length > 0) {
      setTimeout(() => {
        previewManagerRef.current?.applyPayload(currentPayload);
      }, 500); // Small delay to ensure iframe is fully ready
    }
  }, [autoApply, currentPayload]);

  // Refresh iframe
  const handleRefresh = useCallback(() => {
    if (iframeRef.current) {
      setIsLoading(true);
      iframeRef.current.src = url;
    }
  }, [url]);

  // Handle device change
  const handleDeviceChange = useCallback((preset: string) => {
    setDevicePreset(preset);
    if (previewManagerRef.current) {
      previewManagerRef.current.setDevicePreset(preset);
    }
  }, []);

  // Handle live mode toggle
  const handleLiveModeToggle = useCallback((enabled: boolean) => {
    setIsLiveMode(enabled);
    if (previewManagerRef.current) {
      previewManagerRef.current.setLiveMode(enabled);
    }
  }, []);

  // Handle auto-apply toggle
  const handleAutoApplyToggle = useCallback((enabled: boolean) => {
    setAutoApply(enabled);
    if (enabled && previewManagerRef.current && currentPayload.ops.length > 0) {
      previewManagerRef.current.applyPayload(currentPayload);
    }
  }, [currentPayload]);

  // Apply current payload manually
  const handleApplyPayload = useCallback(async () => {
    if (previewManagerRef.current) {
      const result = await previewManagerRef.current.applyPayload(currentPayload);
      console.log('Applied payload:', result);
    }
  }, [currentPayload]);

  // Clear all operations
  const handleClearOperations = useCallback(() => {
    if (previewManagerRef.current) {
      previewManagerRef.current.clearOperations();
    }
  }, []);

  // Take screenshot
  const handleTakeScreenshot = useCallback(async () => {
    if (previewManagerRef.current) {
      const screenshot = await previewManagerRef.current.takeScreenshot();
      if (screenshot) {
        // Trigger download
        const link = document.createElement('a');
        link.href = screenshot;
        link.download = `preview-${Date.now()}.png`;
        link.click();
      }
    }
  }, []);

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

  const deviceConfig = DEVICE_PRESETS[devicePreset] || DEVICE_PRESETS.desktop;
  const hasPerformanceWarnings = performance.warnings.length > 0;

  return (
    <div className={`flex flex-col h-full bg-background ${className}`}>
      {/* Enhanced Toolbar */}
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

        {/* Device Selector */}
        <Select value={devicePreset} onValueChange={handleDeviceChange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desktop">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                Desktop
              </div>
            </SelectItem>
            <SelectItem value="desktop-small">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                Desktop Small
              </div>
            </SelectItem>
            <SelectItem value="tablet">
              <div className="flex items-center gap-2">
                <Tablet className="w-4 h-4" />
                Tablet
              </div>
            </SelectItem>
            <SelectItem value="tablet-landscape">
              <div className="flex items-center gap-2">
                <Tablet className="w-4 h-4" />
                Tablet Landscape
              </div>
            </SelectItem>
            <SelectItem value="mobile">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                Mobile
              </div>
            </SelectItem>
            <SelectItem value="mobile-large">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                Mobile Large
              </div>
            </SelectItem>
            <SelectItem value="mobile-small">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                Mobile Small
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

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

        {/* Preview Controls */}
        <div className="flex items-center gap-2 border-l pl-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleApplyPayload}
            disabled={currentPayload.ops.length === 0}
            title="Apply Current Operations"
          >
            <Play className="w-4 h-4" />
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={handleClearOperations}
            title="Clear Preview"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={handleTakeScreenshot}
            title="Take Screenshot"
          >
            <Camera className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Settings Bar */}
      <div className="flex items-center justify-between gap-4 px-3 py-2 bg-muted/30 border-b text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="live-mode"
              checked={isLiveMode}
              onCheckedChange={handleLiveModeToggle}
            />
            <Label htmlFor="live-mode" className="text-xs">
              SPA Mode
            </Label>
          </div>
          
          <div className="flex items-center gap-2">
            <Switch
              id="auto-apply"
              checked={autoApply}
              onCheckedChange={handleAutoApplyToggle}
            />
            <Label htmlFor="auto-apply" className="text-xs">
              Auto-apply Operations
            </Label>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Device Info */}
          <Badge variant="outline" className="text-xs">
            {deviceConfig.width} × {deviceConfig.height}
            {deviceConfig.pixelRatio > 1 && ` @${deviceConfig.pixelRatio}x`}
          </Badge>

          {/* Performance Metrics */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{Math.round(performance.renderTime)}ms</span>
            
            <span>•</span>
            
            <span>{performance.operationCount} ops</span>
            
            {hasPerformanceWarnings && (
              <>
                <span>•</span>
                <div className="flex items-center gap-1 text-orange-600">
                  <AlertTriangle className="w-3 h-3" />
                  <span>{performance.warnings.length} warnings</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

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

      {/* Performance Warnings */}
      {hasPerformanceWarnings && (
        <div className="px-3 py-2 bg-orange-50 border-b">
          <div className="flex items-center gap-2 text-sm text-orange-800">
            <AlertTriangle className="w-4 h-4" />
            <span>Performance Issues:</span>
            <span className="text-xs">{performance.warnings.join(', ')}</span>
          </div>
        </div>
      )}

      {/* Preview Area */}
      <div className="flex-1 flex items-center justify-center bg-gray-100 p-4">
        <div
          className="relative bg-white shadow-lg rounded-lg overflow-hidden transition-all duration-300"
          style={{
            width: deviceConfig.type === 'desktop' ? '100%' : `${deviceConfig.width}px`,
            height: deviceConfig.type === 'desktop' ? '100%' : `${deviceConfig.height}px`,
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
              pointerEvents: canvasMode === 'preview' ? 'auto' : 'none',
              transform: deviceConfig.pixelRatio > 1 ? `scale(${1 / deviceConfig.pixelRatio})` : 'none',
              transformOrigin: 'top left'
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
          <span>Device: {deviceConfig.type}</span>
          {url && <span>URL: {new URL(url).hostname}</span>}
          {autoApply && (
            <div className="flex items-center gap-1 text-green-600">
              <Zap className="w-3 h-3" />
              <span>Auto-apply</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">
            <Download className="w-3 h-3 mr-1" />
            Export
          </Button>
          <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">
            <Settings className="w-3 h-3 mr-1" />
            Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
