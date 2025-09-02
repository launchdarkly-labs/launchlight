'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle,
  CheckCircle,
  Code,
  Eye,
  Info,
  Target
} from 'lucide-react';
import { 
  TemplateEngine,
  TEMPLATE_CATEGORIES,
  type OperationTemplate 
} from '@/lib/operation-templates';

interface TemplateModalProps {
  template: OperationTemplate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (selectorMappings: Record<string, string>) => void;
}

export function TemplateModal({ template, open, onOpenChange, onApply }: TemplateModalProps) {
  const [selectorMappings, setSelectorMappings] = useState<Record<string, string>>({});
  const [previewOperations, setPreviewOperations] = useState<any[]>([]);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; missing: string[] }>({ valid: false, missing: [] });

  // Initialize mappings when template changes
  useEffect(() => {
    const initialMappings: Record<string, string> = {};
    template.requiredSelectors.forEach(selector => {
      initialMappings[selector.name] = selector.example || '';
    });
    setSelectorMappings(initialMappings);
  }, [template]);

  // Update preview and validation when mappings change
  useEffect(() => {
    const validation = TemplateEngine.validateMappings(template, selectorMappings);
    setValidationResult(validation);

    if (validation.valid) {
      try {
        const operations = TemplateEngine.applyTemplate(template, selectorMappings);
        setPreviewOperations(operations);
      } catch (error) {
        console.error('Failed to generate preview operations:', error);
        setPreviewOperations([]);
      }
    } else {
      setPreviewOperations([]);
    }
  }, [template, selectorMappings]);

  const handleSelectorChange = (selectorName: string, value: string) => {
    setSelectorMappings(prev => ({
      ...prev,
      [selectorName]: value
    }));
  };

  const handleApply = () => {
    if (validationResult.valid) {
      onApply(selectorMappings);
    }
  };

  const categoryInfo = TEMPLATE_CATEGORIES[template.category];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{categoryInfo.icon}</span>
            {template.name}
          </DialogTitle>
          <DialogDescription>
            {template.description}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="configure" className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="configure">
              <Target className="w-4 h-4 mr-2" />
              Configure
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="details">
              <Info className="w-4 h-4 mr-2" />
              Details
            </TabsTrigger>
          </TabsList>

          {/* Configuration Tab */}
          <TabsContent value="configure" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Required Selectors</h4>
                <p className="text-xs text-muted-foreground mb-4">
                  Specify the CSS selectors for elements this template will modify:
                </p>
              </div>

              {template.requiredSelectors.map((selector) => (
                <div key={selector.name} className="space-y-2">
                  <Label htmlFor={selector.name} className="text-sm font-medium">
                    {selector.name}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {selector.description}
                  </p>
                  <Input
                    id={selector.name}
                    value={selectorMappings[selector.name] || ''}
                    onChange={(e) => handleSelectorChange(selector.name, e.target.value)}
                    placeholder={selector.example || `Enter CSS selector for ${selector.name}`}
                    className="font-mono text-sm"
                  />
                  {selector.example && (
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">Example:</span> <code className="bg-muted px-1 rounded">{selector.example}</code>
                    </p>
                  )}
                </div>
              ))}

              {/* Validation Status */}
              {validationResult.missing.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Please provide selectors for: {validationResult.missing.join(', ')}
                  </AlertDescription>
                </Alert>
              )}

              {validationResult.valid && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Configuration is valid. Ready to apply template.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="mt-4">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Generated Operations</h4>
                <p className="text-xs text-muted-foreground mb-4">
                  Preview of the operations that will be created:
                </p>
              </div>

              {previewOperations.length > 0 ? (
                <ScrollArea className="h-64 border rounded-lg p-4">
                  <div className="space-y-3">
                    {previewOperations.map((operation, index) => (
                      <div key={index} className="border rounded-lg p-3 bg-muted/30">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {operation.op}
                          </Badge>
                          <code className="text-xs text-muted-foreground font-mono">
                            {operation.selector}
                          </code>
                        </div>
                        <div className="text-sm">
                          {operation.op === 'textReplace' && (
                            <span>Text: "{operation.value}"</span>
                          )}
                          {operation.op === 'styleSet' && (
                            <span>{operation.name}: {operation.value}</span>
                          )}
                          {operation.op === 'classAdd' && (
                            <span>Add class: .{operation.value}</span>
                          )}
                          {operation.op === 'classRemove' && (
                            <span>Remove class: .{operation.value}</span>
                          )}
                          {operation.op === 'attrSet' && (
                            <span>{operation.name}="{operation.value}"</span>
                          )}
                          {operation.op === 'insertHTML' && (
                            <span>Insert HTML: {operation.html.substring(0, 50)}...</span>
                          )}
                          {(operation.op === 'moveBefore' || operation.op === 'moveAfter') && (
                            <span>Target: {operation.targetSelector}</span>
                          )}
                          {operation.op === 'appendTo' && (
                            <span>Container: {operation.containerSelector}</span>
                          )}
                          {operation.op === 'duplicate' && (
                            <span>Mode: {operation.mode || 'deep'}</span>
                          )}
                          {operation.op === 'remove' && (
                            <span>Remove element</span>
                          )}
                          {operation.op === 'imgSwap' && (
                            <span>Source: {operation.src}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="h-64 border rounded-lg flex items-center justify-center text-center text-muted-foreground">
                  <div>
                    <Code className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">Configure selectors to see preview</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="mt-4">
            <ScrollArea className="h-64">
              <div className="space-y-4">
                {/* Template Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Category</Label>
                    <div className="text-sm">{categoryInfo.icon} {categoryInfo.name}</div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Operations</Label>
                    <div className="text-sm">{template.operations.length} operations</div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Difficulty</Label>
                    <div className="text-sm capitalize">{template.difficulty}</div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Estimated Impact</Label>
                    <div className="text-sm capitalize">{template.estimatedImpact}</div>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <Label className="text-xs text-muted-foreground">Tags</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {template.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <p className="text-sm mt-1">{template.description}</p>
                </div>

                {/* Required Selectors */}
                <div>
                  <Label className="text-xs text-muted-foreground">Required Selectors</Label>
                  <div className="space-y-2 mt-2">
                    {template.requiredSelectors.map((selector, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="font-mono text-sm font-medium">{selector.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">{selector.description}</div>
                        {selector.example && (
                          <code className="text-xs bg-muted px-1 rounded mt-1 block">{selector.example}</code>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleApply} 
            disabled={!validationResult.valid}
            className="min-w-24"
          >
            Apply Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
