'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useExperimentStore } from '@/stores/experiment-store';
import { 
  ArrowLeft, 
  Save, 
  Upload, 
  Play,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Settings
} from 'lucide-react';

interface EditorHeaderProps {
  flagKey: string;
}

export function EditorHeader({ flagKey }: EditorHeaderProps) {
  const {
    flagName,
    selectedVariation,
    isDirty,
    isPublishing,
    validation,
    setSelectedVariation,
    saveExperiment,
    publishExperiment,
    validateCurrentPayload
  } = useExperimentStore();

  const handleSave = async () => {
    try {
      await saveExperiment();
    } catch (error) {
      console.error('Failed to save experiment:', error);
    }
  };

  const handlePublish = async () => {
    const validationResult = validateCurrentPayload();
    
    if (!validationResult.valid) {
      const hasErrors = validationResult.errors.some(e => e.severity === 'error');
      if (hasErrors) {
        alert('Cannot publish: Please fix validation errors first.');
        return;
      }
    }

    try {
      await publishExperiment();
    } catch (error) {
      console.error('Failed to publish experiment:', error);
    }
  };

  const validationResult = validation || validateCurrentPayload();
  const hasErrors = validationResult.errors.some(e => e.severity === 'error');
  const hasWarnings = validationResult.errors.some(e => e.severity === 'warning');

  return (
    <header className="border-b bg-background">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Left: Navigation & Title */}
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Experiments
            </Link>
          </Button>
          
          <div className="border-l pl-4">
            <h1 className="text-lg font-semibold">
              {flagName || `Experiment: ${flagKey}`}
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Flag: {flagKey}</span>
              {selectedVariation && (
                <>
                  <span>•</span>
                  <span>Variation: {selectedVariation}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Center: Variation Selector */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Editing:</span>
            <Select value={selectedVariation || ''} onValueChange={setSelectedVariation}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select variation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="control">Control</SelectItem>
                <SelectItem value="variant-a">Variant A</SelectItem>
                <SelectItem value="variant-b">Variant B</SelectItem>
                <SelectItem value="variant-c">Variant C</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Validation Status */}
          <div className="flex items-center gap-2">
            {hasErrors && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Errors
              </Badge>
            )}
            {hasWarnings && !hasErrors && (
              <Badge variant="outline" className="flex items-center gap-1 text-orange-600 border-orange-300">
                <AlertTriangle className="w-3 h-3" />
                Warnings
              </Badge>
            )}
            {!hasErrors && !hasWarnings && (
              <Badge variant="outline" className="flex items-center gap-1 text-green-600 border-green-300">
                <CheckCircle className="w-3 h-3" />
                Valid
              </Badge>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {isDirty && (
            <Badge variant="outline" className="text-orange-600 border-orange-300">
              Unsaved Changes
            </Badge>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={!isDirty}
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          
          <Button
            size="sm"
            onClick={handlePublish}
            disabled={hasErrors || isPublishing}
            className="min-w-20"
          >
            {isPublishing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Publishing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Publish
              </>
            )}
          </Button>

          <div className="border-l pl-2 ml-2">
            <Button variant="ghost" size="sm" asChild>
              <a 
                href={`https://app.launchdarkly.com/projects/default/flags/${flagKey}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Open in LaunchDarkly"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
            
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      {(hasErrors || hasWarnings) && (
        <div className="border-t bg-muted/30 px-6 py-2">
          <div className="flex items-center gap-4 text-sm">
            {hasErrors && (
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-4 h-4" />
                <span>{validationResult.errors.filter(e => e.severity === 'error').length} validation errors</span>
              </div>
            )}
            {hasWarnings && (
              <div className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="w-4 h-4" />
                <span>{validationResult.errors.filter(e => e.severity === 'warning').length} warnings</span>
              </div>
            )}
            <div className="text-muted-foreground">
              Review the Operations panel for details
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
