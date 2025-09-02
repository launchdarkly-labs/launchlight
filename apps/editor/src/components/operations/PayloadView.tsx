'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Copy, 
  Download, 
  Upload, 
  Eye, 
  EyeOff,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import type { WebExpPayloadV1 } from '@webexp/patch-engine';

interface PayloadViewProps {
  payload: WebExpPayloadV1;
}

export function PayloadView({ payload }: PayloadViewProps) {
  const [copySuccess, setCopySuccess] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const jsonString = JSON.stringify(payload, null, collapsed ? 0 : 2);
  const byteSize = new Blob([jsonString]).size;
  const isLarge = byteSize > 5000; // 5KB threshold for size warning

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'webexp-payload.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string;
            const parsed = JSON.parse(content);
            console.log('Loaded payload:', parsed);
            // In a real implementation, this would update the store
          } catch (error) {
            console.error('Failed to parse JSON file:', error);
            alert('Failed to parse JSON file. Please check the format.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">Payload JSON</h3>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>{(byteSize / 1024).toFixed(1)}KB</span>
            {isLarge && (
              <AlertTriangle className="w-3 h-3 text-orange-500" title="Large payload size" />
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setCollapsed(!collapsed)}
            className="h-7 px-2"
            title={collapsed ? 'Expand JSON' : 'Collapse JSON'}
          >
            {collapsed ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopy}
            className="h-7 px-2"
            title="Copy to clipboard"
          >
            {copySuccess ? (
              <CheckCircle className="w-3 h-3 text-green-500" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDownload}
            className="h-7 px-2"
            title="Download JSON"
          >
            <Download className="w-3 h-3" />
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={handleUpload}
            className="h-7 px-2"
            title="Load JSON file"
          >
            <Upload className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* JSON Content */}
      <div className="flex-1 overflow-auto bg-slate-950 text-slate-100 p-4 rounded-lg font-mono text-xs custom-scrollbar">
        <pre className="whitespace-pre-wrap leading-relaxed">
          <code className="language-json">
            {jsonString}
          </code>
        </pre>
      </div>

      {/* Footer Stats */}
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <div>
          {payload.ops.length} operations
        </div>
        <div className="flex items-center gap-4">
          <span>JSON: {(byteSize / 1024).toFixed(1)}KB</span>
          <span>Estimated gzipped: {((byteSize * 0.3) / 1024).toFixed(1)}KB</span>
        </div>
      </div>

      {/* Copy Success Notification */}
      {copySuccess && (
        <div className="fixed bottom-4 right-4 bg-green-100 text-green-800 px-3 py-2 rounded-lg shadow-lg border border-green-200 flex items-center gap-2 z-50">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm">Copied to clipboard!</span>
        </div>
      )}
    </div>
  );
}
