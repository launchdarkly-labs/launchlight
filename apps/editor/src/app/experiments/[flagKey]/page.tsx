'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { PreviewCanvas } from '@/components/canvas/PreviewCanvas';
import { ElementInspector } from '@/components/inspector/ElementInspector';
import { OperationsList } from '@/components/operations/OperationsList';
import { TemplateLibrary } from '@/components/templates/TemplateLibrary';
import { GoalsManager } from '@/components/goals/GoalsManager';
import { QAPanel } from '@/components/qa/QAPanel';
import { EditorHeader } from '@/components/layout/EditorHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useExperimentStore } from '@/stores/experiment-store';
import type { 
  WebExpOp,
  WebExpPayloadV1
} from '@webexp/patch-engine';
import type { 
  SerializedElement
} from '@webexp/shared';
import type { 
  OperationTemplate
} from '@/lib/operation-templates';
import { TemplateEngine } from '@/lib/operation-templates';

export default function ExperimentEditor() {
  const params = useParams();
  const flagKey = params.flagKey as string;
  
  const {
    currentPayload,
    selectedElement,
    previewUrl,
    setSelectedElement,
    addOperation,
    setPreviewUrl,
    loadExperiment
  } = useExperimentStore();
  
  const [isLoading, setIsLoading] = useState(true);

  // Load experiment data
  useEffect(() => {
    if (flagKey) {
      loadExperiment(flagKey).finally(() => setIsLoading(false));
    }
  }, [flagKey, loadExperiment]);

    // Handle element selection from canvas
  const handleElementSelected = (element: SerializedElement) => {
    setSelectedElement(element);
  };

  // Handle drag operations from canvas
  const handleDragOperation = (operation: unknown) => {
    // For now, just log the operation since the bridge sends opaque operations
    console.log('Drag operation from bridge:', operation);
    
    // TODO: Parse the operation and convert to WebExpOp when bridge is fully implemented
    // This will be implemented in Phase D
  };

  // Handle operations from inspector
  const handleOperationAdd = (operation: WebExpOp) => {
    addOperation(operation);
  };

  // Handle template application
  const handleApplyTemplate = (template: OperationTemplate, selectorMappings: Record<string, string>) => {
    const operations = TemplateEngine.applyTemplate(template, selectorMappings);
    operations.forEach(operation => addOperation(operation));
  };

  // Handle URL change
  const handleUrlChange = (url: string) => {
    setPreviewUrl(url);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading experiment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <EditorHeader flagKey={flagKey} />
      
      {/* Main Editor Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Operations & Templates */}
        <div className="w-80 border-r bg-muted/20 overflow-hidden">
          <Tabs defaultValue="operations" className="h-full flex flex-col">
            <TabsList className="mx-4 mt-4">
              <TabsTrigger value="operations" className="flex-1 text-xs">
                Operations
              </TabsTrigger>
              <TabsTrigger value="templates" className="flex-1 text-xs">
                Templates
              </TabsTrigger>
            </TabsList>
            <TabsContent value="operations" className="flex-1 overflow-hidden mt-0">
              <OperationsList />
            </TabsContent>
            <TabsContent value="templates" className="flex-1 overflow-hidden mt-0">
              <TemplateLibrary onApplyTemplate={handleApplyTemplate} />
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Center Panel - Preview Canvas */}
        <div className="flex-1 overflow-hidden">
          <PreviewCanvas
            url={previewUrl}
            onUrlChange={handleUrlChange}
            onElementSelected={handleElementSelected}
            onDragOperation={handleDragOperation}
          />
        </div>
        
        {/* Right Panel - Inspector & Tools */}
        <div className="w-80 border-l bg-muted/20 overflow-hidden">
          <Tabs defaultValue="inspector" className="h-full flex flex-col">
            <TabsList className="mx-4 mt-4">
              <TabsTrigger value="inspector" className="flex-1 text-xs">
                Inspector
              </TabsTrigger>
              <TabsTrigger value="goals" className="flex-1 text-xs">
                Goals
              </TabsTrigger>
              <TabsTrigger value="qa" className="flex-1 text-xs">
                QA
              </TabsTrigger>
            </TabsList>
            <TabsContent value="inspector" className="flex-1 overflow-hidden mt-0">
              <ElementInspector
                selectedElement={selectedElement}
                onOperationAdd={handleOperationAdd}
              />
            </TabsContent>
            <TabsContent value="goals" className="flex-1 overflow-hidden mt-0">
              <GoalsManager
                goals={[]} // Would be connected to store
                progress={[]}
                onGoalsChange={() => {}} // Would update store
              />
            </TabsContent>
            <TabsContent value="qa" className="flex-1 overflow-hidden mt-0">
              <QAPanel />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
