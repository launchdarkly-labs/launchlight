'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Type, 
  Palette, 
  Settings, 
  Image, 
  Trash2, 
  GripVertical,
  Copy,
  Move,
  Plus,
  Eye,
  EyeOff
} from 'lucide-react';
import type { WebExpOp } from '@webexp/patch-engine';

interface OperationItemProps {
  operation: WebExpOp;
  index: number;
  onRemove: () => void;
  onMove: (dragIndex: number, hoverIndex: number) => void;
  isEnabled?: boolean;
  onToggle?: () => void;
}

const OPERATION_CONFIGS = {
  textReplace: {
    icon: Type,
    label: 'Text Replace',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    description: (op: Extract<WebExpOp, { op: 'textReplace' }>) => 
      `"${op.value.substring(0, 30)}${op.value.length > 30 ? '...' : ''}"`
  },
  attrSet: {
    icon: Settings,
    label: 'Set Attribute',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    description: (op: Extract<WebExpOp, { op: 'attrSet' }>) => 
      `${op.name}='${op.value}'`
  },
  classAdd: {
    icon: Plus,
    label: 'Add Class',
    color: 'bg-green-100 text-green-700 border-green-200',
    description: (op: Extract<WebExpOp, { op: 'classAdd' }>) => 
      `.${op.value}`
  },
  classRemove: {
    icon: Trash2,
    label: 'Remove Class',
    color: 'bg-red-100 text-red-700 border-red-200',
    description: (op: Extract<WebExpOp, { op: 'classRemove' }>) => 
      `.${op.value}`
  },
  classToggle: {
    icon: Eye,
    label: 'Toggle Class',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    description: (op: Extract<WebExpOp, { op: 'classToggle' }>) => 
      `.${op.value}`
  },
  styleSet: {
    icon: Palette,
    label: 'Set Style',
    color: 'bg-pink-100 text-pink-700 border-pink-200',
    description: (op: Extract<WebExpOp, { op: 'styleSet' }>) => 
      `${op.name}: ${op.value}`
  },
  imgSwap: {
    icon: Image,
    label: 'Swap Image',
    color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    description: (op: Extract<WebExpOp, { op: 'imgSwap' }>) => 
      new URL(op.src).pathname.split('/').pop() || op.src
  },
  remove: {
    icon: Trash2,
    label: 'Remove Element',
    color: 'bg-red-100 text-red-700 border-red-200',
    description: () => 'Delete element'
  },
  insertHTML: {
    icon: Type,
    label: 'Insert HTML',
    color: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    description: (op: Extract<WebExpOp, { op: 'insertHTML' }>) => 
      `${op.html.substring(0, 30)}${op.html.length > 30 ? '...' : ''}`
  },
  moveBefore: {
    icon: Move,
    label: 'Move Before',
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    description: (op: Extract<WebExpOp, { op: 'moveBefore' }>) => 
      `before target`
  },
  moveAfter: {
    icon: Move,
    label: 'Move After',
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    description: (op: Extract<WebExpOp, { op: 'moveAfter' }>) => 
      `after target`
  },
  appendTo: {
    icon: Move,
    label: 'Move To',
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    description: (op: Extract<WebExpOp, { op: 'appendTo' }>) => 
      `into container`
  },
  duplicate: {
    icon: Copy,
    label: 'Duplicate',
    color: 'bg-teal-100 text-teal-700 border-teal-200',
    description: (op: Extract<WebExpOp, { op: 'duplicate' }>) => 
      op.mode === 'shallow' ? 'shallow copy' : 'deep copy'
  }
};

export function OperationItem({
  operation,
  index,
  onRemove,
  onMove,
  isEnabled = true,
  onToggle
}: OperationItemProps) {
  const config = OPERATION_CONFIGS[operation.op];
  const Icon = config.icon;

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    const hoverIndex = index;
    
    if (dragIndex !== hoverIndex) {
      onMove(dragIndex, hoverIndex);
    }
  };

  const selector = operation.selector;
  const shortSelector = selector.length > 40 ? 
    `${selector.substring(0, 37)}...` : 
    selector;

  return (
    <Card 
      className={`transition-all duration-200 hover:shadow-sm ${
        isEnabled ? '' : 'opacity-60'
      }`}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          {/* Drag Handle */}
          <button 
            className="mt-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
            title="Drag to reorder"
          >
            <GripVertical className="w-4 h-4" />
          </button>

          {/* Operation Icon & Badge */}
          <div className="flex-shrink-0">
            <Badge 
              variant="outline" 
              className={`${config.color} border flex items-center gap-1.5 px-2 py-1`}
            >
              <Icon className="w-3 h-3" />
              <span className="text-xs font-medium">{config.label}</span>
            </Badge>
          </div>

          {/* Operation Details */}
          <div className="flex-1 min-w-0 space-y-1">
            {/* Selector */}
            <div className="font-mono text-xs text-muted-foreground truncate" title={selector}>
              {shortSelector}
            </div>
            
            {/* Description */}
            <div className="text-sm">
              {(config.description as any)(operation)}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {onToggle && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onToggle}
                className="h-7 w-7 p-0"
                title={isEnabled ? 'Disable operation' : 'Enable operation'}
              >
                {isEnabled ? (
                  <Eye className="w-3 h-3" />
                ) : (
                  <EyeOff className="w-3 h-3" />
                )}
              </Button>
            )}
            
            <Button
              size="sm"
              variant="ghost"
              onClick={onRemove}
              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
              title="Remove operation"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Additional Details for Move Operations */}
        {(operation.op === 'moveBefore' || operation.op === 'moveAfter') && 'targetSelector' in operation && (
          <div className="mt-2 pl-7 text-xs text-muted-foreground font-mono">
            → {operation.targetSelector.length > 35 ? 
               `${operation.targetSelector.substring(0, 32)}...` : 
               operation.targetSelector}
          </div>
        )}

        {operation.op === 'appendTo' && 'containerSelector' in operation && (
          <div className="mt-2 pl-7 text-xs text-muted-foreground font-mono">
            → {operation.containerSelector.length > 35 ? 
               `${operation.containerSelector.substring(0, 32)}...` : 
               operation.containerSelector}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
