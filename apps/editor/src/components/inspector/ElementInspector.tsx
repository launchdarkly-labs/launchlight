'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Type, 
  Palette, 
  Settings, 
  Copy, 
  Trash2, 
  Eye, 
  EyeOff,
  Image,
  Link,
  Plus,
  Minus
} from 'lucide-react';
import type { 
  SerializedElement
} from '@webexp/shared';
import type { WebExpOp } from '@webexp/patch-engine';
import { usePreviewStore } from '@/stores/preview-store';

interface ElementInspectorProps {
  selectedElement: SerializedElement | null;
  onOperationAdd: (operation: WebExpOp) => void;
  className?: string;
}

export function ElementInspector({
  selectedElement,
  onOperationAdd,
  className = ''
}: ElementInspectorProps) {
  const { addOp } = usePreviewStore();
  const [textContent, setTextContent] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [newAttribute, setNewAttribute] = useState({ name: '', value: '' });
  const [newStyle, setNewStyle] = useState({ property: '', value: '' });
  const [newImageSrc, setNewImageSrc] = useState('');
  const [newImageAlt, setNewImageAlt] = useState('');

  // Update form values when selected element changes
  useEffect(() => {
    if (selectedElement) {
      setTextContent(selectedElement.metadata.textContent);
      setNewImageSrc('');
      setNewImageAlt('');
    }
  }, [selectedElement]);

  if (!selectedElement) {
    return (
      <div className={`p-6 text-center text-muted-foreground ${className}`}>
        <div className="space-y-3">
          <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
            <Settings className="w-8 h-8" />
          </div>
          <h3 className="font-medium">No Element Selected</h3>
          <p className="text-sm">
            Select an element in the preview to edit its properties
          </p>
        </div>
      </div>
    );
  }

  const handleTextReplace = () => {
    if (textContent.trim()) {
      // Add to preview store for live preview
      addOp({
        type: 'text',
        selector: selectedElement.selector,
        value: textContent.trim()
      });
      
      // Also add to main operations
      onOperationAdd({
        op: 'textReplace',
        selector: selectedElement.selector,
        value: textContent.trim()
      });
    }
  };

  const handleClassAdd = () => {
    if (newClassName.trim()) {
      // Add to preview store for live preview
      addOp({
        type: 'class',
        selector: selectedElement.selector,
        value: newClassName.trim()
      });
      
      // Also add to main operations
      onOperationAdd({
        op: 'classAdd',
        selector: selectedElement.selector,
        value: newClassName.trim()
      });
      setNewClassName('');
    }
  };

  const handleClassRemove = (className: string) => {
    // Add to preview store for live preview
    addOp({
      type: 'class',
      selector: selectedElement.selector,
      value: className
    });
    
    // Also add to main operations
    onOperationAdd({
      op: 'classRemove',
      selector: selectedElement.selector,
      value: className
    });
  };

  const handleClassToggle = (className: string) => {
    onOperationAdd({
      op: 'classToggle',
      selector: selectedElement.selector,
      value: className
    });
  };

  const handleAttributeSet = () => {
    if (newAttribute.name.trim()) {
      onOperationAdd({
        op: 'attrSet',
        selector: selectedElement.selector,
        name: newAttribute.name.trim(),
        value: newAttribute.value
      });
      setNewAttribute({ name: '', value: '' });
    }
  };

  const handleStyleSet = () => {
    if (newStyle.property.trim() && newStyle.value.trim()) {
      onOperationAdd({
        op: 'styleSet',
        selector: selectedElement.selector,
        name: newStyle.property.trim(),
        value: newStyle.value.trim()
      });
      setNewStyle({ property: '', value: '' });
    }
  };

  const handleImageSwap = () => {
    if (newImageSrc.trim()) {
      onOperationAdd({
        op: 'imgSwap',
        selector: selectedElement.selector,
        src: newImageSrc.trim(),
        alt: newImageAlt.trim() || undefined
      });
    }
  };

  const handleDuplicate = () => {
    onOperationAdd({
      op: 'duplicate',
      selector: selectedElement.selector,
      mode: 'deep'
    });
  };

  const handleRemove = () => {
    onOperationAdd({
      op: 'remove',
      selector: selectedElement.selector
    });
  };

  const isImage = selectedElement.metadata.tagName === 'img';
  const isText = ['p', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'button'].includes(
    selectedElement.metadata.tagName
  );

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Element Info Header */}
      <Card className="m-4 mb-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {selectedElement.metadata.tagName.toUpperCase()}
            </CardTitle>
            <div className="flex items-center gap-1">
              {selectedElement.isContainer && <Badge variant="secondary">Container</Badge>}
              {selectedElement.canDrag && <Badge variant="outline">Draggable</Badge>}
            </div>
          </div>
          <CardDescription className="font-mono text-xs">
            {selectedElement.selector}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {selectedElement.metadata.classList.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground">Classes</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedElement.metadata.classList.map((cls, index) => (
                    <Badge 
                      key={index} 
                      variant="outline" 
                      className="text-xs cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => handleClassRemove(cls)}
                      title={`Click to remove class: ${cls}`}
                    >
                      {cls}
                      <Minus className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {selectedElement.metadata.textContent && (
              <div>
                <Label className="text-xs text-muted-foreground">Text Content</Label>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  "{selectedElement.metadata.textContent}"
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Editing Tabs */}
      <div className="flex-1 px-4 pb-4">
        <Tabs defaultValue="content" className="h-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="content" className="text-xs">
              <Type className="w-3 h-3 mr-1" />
              Content
            </TabsTrigger>
            <TabsTrigger value="style" className="text-xs">
              <Palette className="w-3 h-3 mr-1" />
              Style
            </TabsTrigger>
            <TabsTrigger value="attributes" className="text-xs">
              <Settings className="w-3 h-3 mr-1" />
              Attrs
            </TabsTrigger>
            <TabsTrigger value="actions" className="text-xs">
              Actions
            </TabsTrigger>
          </TabsList>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-4 mt-4">
            {isText && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Text Content</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="Enter new text content..."
                    rows={3}
                  />
                  <Button 
                    onClick={handleTextReplace}
                    size="sm"
                    className="w-full"
                    disabled={!textContent.trim()}
                  >
                    Update Text
                  </Button>
                </CardContent>
              </Card>
            )}

            {isImage && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Image Properties</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="image-src">Source URL</Label>
                    <Input
                      id="image-src"
                      value={newImageSrc}
                      onChange={(e) => setNewImageSrc(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="image-alt">Alt Text</Label>
                    <Input
                      id="image-alt"
                      value={newImageAlt}
                      onChange={(e) => setNewImageAlt(e.target.value)}
                      placeholder="Alternative text for accessibility"
                    />
                  </div>
                  <Button 
                    onClick={handleImageSwap}
                    size="sm"
                    className="w-full"
                    disabled={!newImageSrc.trim()}
                  >
                    <Image className="w-4 h-4 mr-2" />
                    Update Image
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Style Tab */}
          <TabsContent value="style" className="space-y-4 mt-4">
            {/* CSS Classes */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">CSS Classes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="class-name"
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleClassAdd}
                    size="sm"
                    disabled={!newClassName.trim()}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {selectedElement.metadata.classList.length > 0 && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Current Classes</Label>
                    <div className="space-y-1">
                      {selectedElement.metadata.classList.map((cls, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                          <span className="font-mono">{cls}</span>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleClassToggle(cls)}
                              className="h-6 px-2"
                            >
                              <EyeOff className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleClassRemove(cls)}
                              className="h-6 px-2 text-destructive"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* CSS Styles */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">CSS Styles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="style-property">Property</Label>
                    <Select onValueChange={(value) => setNewStyle(prev => ({ ...prev, property: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select property" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="color">color</SelectItem>
                        <SelectItem value="background-color">background-color</SelectItem>
                        <SelectItem value="font-size">font-size</SelectItem>
                        <SelectItem value="font-weight">font-weight</SelectItem>
                        <SelectItem value="margin">margin</SelectItem>
                        <SelectItem value="padding">padding</SelectItem>
                        <SelectItem value="border">border</SelectItem>
                        <SelectItem value="border-radius">border-radius</SelectItem>
                        <SelectItem value="display">display</SelectItem>
                        <SelectItem value="opacity">opacity</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="style-value">Value</Label>
                    <Input
                      id="style-value"
                      value={newStyle.value}
                      onChange={(e) => setNewStyle(prev => ({ ...prev, value: e.target.value }))}
                      placeholder="e.g., red, 16px, bold"
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleStyleSet}
                  size="sm"
                  className="w-full"
                  disabled={!newStyle.property || !newStyle.value.trim()}
                >
                  Apply Style
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attributes Tab */}
          <TabsContent value="attributes" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">HTML Attributes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="attr-name">Attribute</Label>
                    <Input
                      id="attr-name"
                      value={newAttribute.name}
                      onChange={(e) => setNewAttribute(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="title, href, target..."
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="attr-value">Value</Label>
                    <Input
                      id="attr-value"
                      value={newAttribute.value}
                      onChange={(e) => setNewAttribute(prev => ({ ...prev, value: e.target.value }))}
                      placeholder="Attribute value"
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleAttributeSet}
                  size="sm"
                  className="w-full"
                  disabled={!newAttribute.name.trim()}
                >
                  Set Attribute
                </Button>

                {/* Current Attributes */}
                {Object.keys(selectedElement.metadata.attributes).length > 0 && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Current Attributes</Label>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {Object.entries(selectedElement.metadata.attributes).map(([name, value], index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded text-xs">
                          <div className="flex-1 min-w-0">
                            <span className="font-mono text-blue-600">{name}</span>
                            <span className="text-muted-foreground mx-1">=</span>
                            <span className="font-mono truncate">"{value}"</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigator.clipboard.writeText(`${name}="${value}"`)}
                            className="h-6 px-2 ml-1"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Actions Tab */}
          <TabsContent value="actions" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Element Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={handleDuplicate}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate Element
                </Button>
                
                <Button 
                  onClick={handleRemove}
                  variant="destructive"
                  size="sm"
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove Element
                </Button>
              </CardContent>
            </Card>

            {/* Element Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Element Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-muted-foreground">Tag</Label>
                    <div className="font-mono">{selectedElement.metadata.tagName}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Type</Label>
                    <div>
                      {selectedElement.isContainer ? 'Container' : 'Element'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Draggable</Label>
                    <div>{selectedElement.canDrag ? 'Yes' : 'No'}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Drop Target</Label>
                    <div>{selectedElement.isDropTarget ? 'Yes' : 'No'}</div>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Selector</Label>
                  <div className="font-mono text-xs bg-muted p-2 rounded mt-1 break-all">
                    {selectedElement.selector}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
