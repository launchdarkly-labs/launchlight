'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Star,
  TrendingUp,
  Zap,
  BookOpen,
  Plus,
  Clock
} from 'lucide-react';
import { TEMPLATE_CATEGORIES, type OperationTemplate } from '@/lib/operation-templates';

interface TemplateCardProps {
  template: OperationTemplate;
  onSelect: () => void;
  compact?: boolean;
}

const DIFFICULTY_CONFIG = {
  beginner: { icon: '🟢', label: 'Beginner', color: 'text-green-600' },
  intermediate: { icon: '🟡', label: 'Intermediate', color: 'text-yellow-600' },
  advanced: { icon: '🔴', label: 'Advanced', color: 'text-red-600' }
};

const IMPACT_CONFIG = {
  low: { icon: '📊', label: 'Low Impact', color: 'text-gray-600' },
  medium: { icon: '📈', label: 'Medium Impact', color: 'text-blue-600' },
  high: { icon: '🚀', label: 'High Impact', color: 'text-purple-600' }
};

export function TemplateCard({ template, onSelect, compact = false }: TemplateCardProps) {
  const categoryInfo = TEMPLATE_CATEGORIES[template.category];
  const difficultyConfig = DIFFICULTY_CONFIG[template.difficulty];
  const impactConfig = IMPACT_CONFIG[template.estimatedImpact];

  if (compact) {
    return (
      <Card className="hover:shadow-sm transition-all duration-200 cursor-pointer" onClick={onSelect}>
        <CardContent className="p-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-sm truncate">{template.name}</h4>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="text-xs">{difficultyConfig.icon}</span>
                  <span className="text-xs">{impactConfig.icon}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {template.description}
              </p>
              <div className="flex items-center gap-1 mt-2">
                <Badge variant="outline" className="text-xs h-5 px-1.5">
                  {categoryInfo.icon} {categoryInfo.name}
                </Badge>
                <Badge variant="outline" className="text-xs h-5 px-1.5">
                  {template.operations.length} ops
                </Badge>
              </div>
            </div>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 ml-2 flex-shrink-0">
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-all duration-200 cursor-pointer group" onClick={onSelect}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm mb-1 group-hover:text-primary transition-colors">
              {template.name}
            </CardTitle>
            <CardDescription className="text-xs line-clamp-2">
              {template.description}
            </CardDescription>
          </div>
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Category and Stats */}
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="secondary" className="text-xs h-6 px-2">
            {categoryInfo.icon} {categoryInfo.name}
          </Badge>
          <Badge variant="outline" className="text-xs h-6 px-2">
            {template.operations.length} operations
          </Badge>
        </div>

        {/* Difficulty and Impact */}
        <div className="flex items-center justify-between mb-3 text-xs">
          <div className="flex items-center gap-1">
            <span>{difficultyConfig.icon}</span>
            <span className={difficultyConfig.color}>{difficultyConfig.label}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>{impactConfig.icon}</span>
            <span className={impactConfig.color}>{impactConfig.label}</span>
          </div>
        </div>

        {/* Tags */}
        {template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {template.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs h-5 px-1.5 font-normal">
                {tag}
              </Badge>
            ))}
            {template.tags.length > 3 && (
              <Badge variant="outline" className="text-xs h-5 px-1.5 font-normal">
                +{template.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Required Selectors Preview */}
        {template.requiredSelectors.length > 0 && (
          <div className="text-xs text-muted-foreground">
            <div className="flex items-center gap-1 mb-1">
              <Clock className="w-3 h-3" />
              <span>Requires {template.requiredSelectors.length} selector{template.requiredSelectors.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="space-y-0.5">
              {template.requiredSelectors.slice(0, 2).map((selector, index) => (
                <div key={index} className="font-mono text-xs">
                  {selector.name}: {selector.description}
                </div>
              ))}
              {template.requiredSelectors.length > 2 && (
                <div className="text-xs">
                  +{template.requiredSelectors.length - 2} more...
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
