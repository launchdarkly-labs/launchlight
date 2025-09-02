'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  Search,
  Plus,
  Star,
  TrendingUp,
  Zap,
  BookOpen,
  Filter,
  X
} from 'lucide-react';
import { 
  OPERATION_TEMPLATES,
  TEMPLATE_CATEGORIES,
  TemplateEngine,
  type OperationTemplate 
} from '@/lib/operation-templates';
import { TemplateCard } from './TemplateCard';
import { TemplateModal } from './TemplateModal';

interface TemplateLibraryProps {
  onApplyTemplate: (template: OperationTemplate, selectorMappings: Record<string, string>) => void;
  className?: string;
}

export function TemplateLibrary({ onApplyTemplate, className = '' }: TemplateLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedImpact, setSelectedImpact] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<OperationTemplate | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Filter and search templates
  const filteredTemplates = useMemo(() => {
    let filtered = OPERATION_TEMPLATES;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = TemplateEngine.searchTemplates(searchQuery);
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Apply difficulty filter
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(template => template.difficulty === selectedDifficulty);
    }

    // Apply impact filter
    if (selectedImpact !== 'all') {
      filtered = filtered.filter(template => template.estimatedImpact === selectedImpact);
    }

    return filtered;
  }, [searchQuery, selectedCategory, selectedDifficulty, selectedImpact]);

  // Group templates by category for category view
  const templatesByCategory = useMemo(() => {
    const grouped: Record<string, OperationTemplate[]> = {};
    
    filteredTemplates.forEach(template => {
      if (!grouped[template.category]) {
        grouped[template.category] = [];
      }
      grouped[template.category].push(template);
    });
    
    return grouped;
  }, [filteredTemplates]);

  const handleTemplateSelect = (template: OperationTemplate) => {
    setSelectedTemplate(template);
    setShowModal(true);
  };

  const handleApplyTemplate = (selectorMappings: Record<string, string>) => {
    if (selectedTemplate) {
      onApplyTemplate(selectedTemplate, selectorMappings);
      setShowModal(false);
      setSelectedTemplate(null);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedDifficulty('all');
    setSelectedImpact('all');
  };

  const hasActiveFilters = searchQuery || selectedCategory !== 'all' || selectedDifficulty !== 'all' || selectedImpact !== 'all';

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b bg-background">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Template Library</h2>
          <Badge variant="outline" className="text-xs">
            {OPERATION_TEMPLATES.length} templates
          </Badge>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="pl-10"
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-3 gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="text-xs">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(TEMPLATE_CATEGORIES).map(([key, category]) => (
                <SelectItem key={key} value={key}>
                  {category.icon} {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
            <SelectTrigger className="text-xs">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="beginner">🟢 Beginner</SelectItem>
              <SelectItem value="intermediate">🟡 Intermediate</SelectItem>
              <SelectItem value="advanced">🔴 Advanced</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedImpact} onValueChange={setSelectedImpact}>
            <SelectTrigger className="text-xs">
              <SelectValue placeholder="Impact" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Impact</SelectItem>
              <SelectItem value="low">📊 Low Impact</SelectItem>
              <SelectItem value="medium">📈 Medium Impact</SelectItem>
              <SelectItem value="high">🚀 High Impact</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="w-4 h-4" />
              <span>{filteredTemplates.length} results</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={clearFilters}
              className="text-xs h-6 px-2"
            >
              <X className="w-3 h-3 mr-1" />
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="grid" className="h-full flex flex-col">
          <TabsList className="mx-4 mt-4">
            <TabsTrigger value="grid" className="flex-1 text-xs">
              Grid View
            </TabsTrigger>
            <TabsTrigger value="category" className="flex-1 text-xs">
              By Category
            </TabsTrigger>
          </TabsList>

          {/* Grid View */}
          <TabsContent value="grid" className="flex-1 overflow-hidden mt-0 p-4 pt-2">
            {filteredTemplates.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
                <div className="space-y-3">
                  <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                    <Search className="w-8 h-8" />
                  </div>
                  <h3 className="font-medium">No Templates Found</h3>
                  <p className="text-sm">
                    Try adjusting your search or filters
                  </p>
                  {hasActiveFilters && (
                    <Button size="sm" variant="outline" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid gap-3 h-full overflow-y-auto custom-scrollbar">
                {filteredTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onSelect={() => handleTemplateSelect(template)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Category View */}
          <TabsContent value="category" className="flex-1 overflow-hidden mt-0 p-4 pt-2">
            <div className="h-full overflow-y-auto custom-scrollbar space-y-6">
              {Object.entries(templatesByCategory).map(([categoryKey, templates]) => {
                const categoryInfo = TEMPLATE_CATEGORIES[categoryKey as keyof typeof TEMPLATE_CATEGORIES];
                
                return (
                  <div key={categoryKey}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">{categoryInfo.icon}</span>
                      <h3 className="font-medium">{categoryInfo.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {templates.length}
                      </Badge>
                    </div>
                    <div className="grid gap-3">
                      {templates.map((template) => (
                        <TemplateCard
                          key={template.id}
                          template={template}
                          onSelect={() => handleTemplateSelect(template)}
                          compact
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Template Application Modal */}
      {selectedTemplate && (
        <TemplateModal
          template={selectedTemplate}
          open={showModal}
          onOpenChange={setShowModal}
          onApply={handleApplyTemplate}
        />
      )}
    </div>
  );
}
