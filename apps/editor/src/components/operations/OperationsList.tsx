'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OperationItem } from './OperationItem';
import { PayloadView } from './PayloadView';
import { useExperimentStore } from '@/stores/experiment-store';
import { 
  List, 
  Code, 
  Undo2, 
  Redo2, 
  Trash2, 
  AlertTriangle,
  CheckCircle,
  Info,
  Rocket
} from 'lucide-react';

export function OperationsList() {
  const {
    currentPayload,
    validation,
    canUndo,
    canRedo,
    undo,
    redo,
    clearOperations,
    validateCurrentPayload,
    removeOperation,
    reorderOperations,
    publishExperiment,
    isPublishing
  } = useExperimentStore();

  const handleValidate = () => {
    validateCurrentPayload();
  };

  const handleClearAll = () => {
    if (currentPayload.ops.length > 0) {
      if (confirm('Are you sure you want to clear all operations?')) {
        clearOperations();
      }
    }
  };

  const validationSummary = validation || validateCurrentPayload();
  const hasErrors = validationSummary.errors.some(e => e.severity === 'error');
  const hasWarnings = validationSummary.errors.some(e => e.severity === 'warning');

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-background">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Operations</h2>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={undo}
              disabled={!canUndo()}
              title="Undo"
            >
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={redo}
              disabled={!canRedo()}
              title="Redo"
            >
              <Redo2 className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleClearAll}
              disabled={currentPayload.ops.length === 0}
              title="Clear All"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              onClick={publishExperiment}
              disabled={isPublishing || currentPayload.ops.length === 0 || hasErrors}
              title="Publish to LaunchDarkly"
            >
              <Rocket className="w-4 h-4 mr-2" />
              {isPublishing ? 'Publishing…' : 'Publish'}
            </Button>
          </div>
        </div>

        {/* Validation Summary */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {currentPayload.ops.length} operations
            </span>
            {validationSummary.sizeInfo && (
              <Badge variant="outline" className="text-xs">
                {Math.ceil((validationSummary.sizeInfo.gzippedSize as number) / 1024)}KB
              </Badge>
            )}
          </div>

          {(hasErrors || hasWarnings) && (
            <div className="space-y-1">
              {hasErrors && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{validationSummary.errors.filter(e => e.severity === 'error').length} errors</span>
                </div>
              )}
              {hasWarnings && (
                <div className="flex items-center gap-2 text-sm text-orange-600">
                  <Info className="w-4 h-4" />
                  <span>{validationSummary.errors.filter(e => e.severity === 'warning').length} warnings</span>
                </div>
              )}
            </div>
          )}

          {!hasErrors && !hasWarnings && currentPayload.ops.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span>All operations valid</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="operations" className="h-full flex flex-col">
          <TabsList className="mx-4 mt-4">
            <TabsTrigger value="operations" className="flex-1">
              <List className="w-4 h-4 mr-2" />
              Operations
            </TabsTrigger>
            <TabsTrigger value="json" className="flex-1">
              <Code className="w-4 h-4 mr-2" />
              JSON
            </TabsTrigger>
          </TabsList>

          {/* Operations List */}
          <TabsContent value="operations" className="flex-1 overflow-hidden mt-0 p-4 pt-2">
            {currentPayload.ops.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
                <div className="space-y-3">
                  <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                    <List className="w-8 h-8" />
                  </div>
                  <h3 className="font-medium">No Operations</h3>
                  <p className="text-sm">
                    Select elements in the preview to start editing
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 h-full overflow-y-auto custom-scrollbar">
                {currentPayload.ops.map((operation, index) => (
                  <OperationItem
                    key={index}
                    operation={operation}
                    index={index}
                    onRemove={() => removeOperation(index)}
                    onMove={(dragIndex, hoverIndex) => reorderOperations(dragIndex, hoverIndex)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* JSON View */}
          <TabsContent value="json" className="flex-1 overflow-hidden mt-0 p-4 pt-2">
            <PayloadView payload={currentPayload} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Validation Errors Panel */}
      {(hasErrors || hasWarnings) && (
        <div className="border-t bg-muted/30 max-h-40 overflow-y-auto">
          <div className="p-3">
            <h4 className="text-sm font-medium mb-2">
              Validation Issues
            </h4>
            <div className="space-y-2">
              {validationSummary.errors.map((error, index) => (
                <div 
                  key={index}
                  className={`text-xs p-2 rounded ${
                    error.severity === 'error' 
                      ? 'bg-destructive/10 text-destructive border border-destructive/20' 
                      : 'bg-orange-50 text-orange-700 border border-orange-200'
                  }`}
                >
                  <div className="font-medium">{error.path}</div>
                  <div>{error.message}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
