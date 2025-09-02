'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Plus,
  Target,
  Clock,
  Scroll,
  FileText,
  MousePointer,
  Eye,
  Play,
  Download,
  Trash2,
  Edit,
  BarChart3,
  CheckCircle,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { 
  type AnyAdvancedGoal,
  type FormCompletionGoal,
  type ScrollDepthGoal,
  type TimeOnPageGoal,
  type ElementVisibilityGoal,
  type HoverGoal,
  type VideoPlayGoal,
  type FileDownloadGoal,
  type GoalProgress,
  AdvancedGoalTracker
} from '@/lib/advanced-goals';

interface GoalsManagerProps {
  goals: AnyAdvancedGoal[];
  progress: GoalProgress[];
  onGoalsChange: (goals: AnyAdvancedGoal[]) => void;
  className?: string;
}

const GOAL_TYPES = [
  { value: 'click', label: 'Click Event', icon: MousePointer, description: 'Track clicks on specific elements' },
  { value: 'pageview', label: 'Page View', icon: Eye, description: 'Track when users visit specific pages' },
  { value: 'form-completion', label: 'Form Completion', icon: FileText, description: 'Track form submissions and field completion' },
  { value: 'scroll-depth', label: 'Scroll Depth', icon: Scroll, description: 'Track how far users scroll down the page' },
  { value: 'time-on-page', label: 'Time on Page', icon: Clock, description: 'Track how long users spend on the page' },
  { value: 'element-visibility', label: 'Element Visibility', icon: Eye, description: 'Track when elements become visible' },
  { value: 'hover', label: 'Hover Interaction', icon: MousePointer, description: 'Track hover events on elements' },
  { value: 'video-play', label: 'Video Play', icon: Play, description: 'Track video play events and progress' },
  { value: 'file-download', label: 'File Download', icon: Download, description: 'Track file download events' }
];

export function GoalsManager({ goals, progress, onGoalsChange, className = '' }: GoalsManagerProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState<AnyAdvancedGoal | null>(null);
  const [selectedGoalType, setSelectedGoalType] = useState<string>('click');

  const handleCreateGoal = useCallback(() => {
    setEditingGoal(null);
    setSelectedGoalType('click');
    setShowCreateDialog(true);
  }, []);

  const handleEditGoal = useCallback((goal: AnyAdvancedGoal) => {
    setEditingGoal(goal);
    setSelectedGoalType(goal.type);
    setShowCreateDialog(true);
  }, []);

  const handleDeleteGoal = useCallback((goalId: string) => {
    if (confirm('Are you sure you want to delete this goal?')) {
      const updatedGoals = goals.filter(g => g.eventKey !== goalId);
      onGoalsChange(updatedGoals);
    }
  }, [goals, onGoalsChange]);

  const handleSaveGoal = useCallback((goal: AnyAdvancedGoal) => {
    let updatedGoals: AnyAdvancedGoal[];
    
    if (editingGoal) {
      updatedGoals = goals.map(g => g.eventKey === editingGoal.eventKey ? goal : g);
    } else {
      updatedGoals = [...goals, goal];
    }
    
    onGoalsChange(updatedGoals);
    setShowCreateDialog(false);
    setEditingGoal(null);
  }, [editingGoal, goals, onGoalsChange]);

  const getGoalProgress = useCallback((goalId: string): GoalProgress | undefined => {
    return progress.find(p => p.goalId === goalId);
  }, [progress]);

  const getGoalIcon = (type: string) => {
    const goalType = GOAL_TYPES.find(t => t.value === type);
    return goalType?.icon || Target;
  };

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b bg-background">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Goals & Tracking</h2>
          <Button onClick={handleCreateGoal} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Goal
          </Button>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{goals.length} goals configured</span>
          <span>•</span>
          <span>{progress.filter(p => p.isCompleted).length} completed</span>
          <span>•</span>
          <span>{progress.filter(p => p.progress > 0 && !p.isCompleted).length} in progress</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="list" className="h-full flex flex-col">
          <TabsList className="mx-4 mt-4">
            <TabsTrigger value="list" className="flex-1 text-xs">
              <Target className="w-4 h-4 mr-2" />
              Goals List
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex-1 text-xs">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Goals List */}
          <TabsContent value="list" className="flex-1 overflow-hidden mt-0 p-4 pt-2">
            {goals.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
                <div className="space-y-3">
                  <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                    <Target className="w-8 h-8" />
                  </div>
                  <h3 className="font-medium">No Goals Configured</h3>
                  <p className="text-sm">
                    Add goals to track user interactions and measure experiment success
                  </p>
                  <Button onClick={handleCreateGoal} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Goal
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 h-full overflow-y-auto custom-scrollbar">
                {goals.map((goal) => {
                  const goalProgress = getGoalProgress(goal.eventKey);
                  const Icon = getGoalIcon(goal.type);
                  
                  return (
                    <Card key={goal.eventKey} className="hover:shadow-sm transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <Icon className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-sm">
                                {GOAL_TYPES.find(t => t.value === goal.type)?.label || goal.type}
                              </CardTitle>
                              <CardDescription className="text-xs">
                                Event: {goal.eventKey}
                              </CardDescription>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            {goalProgress?.isCompleted && (
                              <Badge variant="default" className="text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Completed
                              </Badge>
                            )}
                            {goalProgress && !goalProgress.isCompleted && goalProgress.progress > 0 && (
                              <Badge variant="outline" className="text-xs">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                {Math.round(goalProgress.progress)}%
                              </Badge>
                            )}
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditGoal(goal)}
                              className="h-6 w-6 p-0"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteGoal(goal.eventKey)}
                              className="h-6 w-6 p-0 text-destructive"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          {/* Goal-specific details */}
                          {goal.type === 'form-completion' && (
                            <div className="text-xs text-muted-foreground">
                              <div>Form: <code className="bg-muted px-1 rounded">{(goal as FormCompletionGoal).formSelector}</code></div>
                              {(goal as FormCompletionGoal).completionThreshold && (
                                <div>Threshold: {(goal as FormCompletionGoal).completionThreshold}%</div>
                              )}
                            </div>
                          )}
                          
                          {goal.type === 'scroll-depth' && (
                            <div className="text-xs text-muted-foreground">
                              <div>Thresholds: {(goal as ScrollDepthGoal).thresholds.join(', ')}%</div>
                            </div>
                          )}
                          
                          {goal.type === 'time-on-page' && (
                            <div className="text-xs text-muted-foreground">
                              <div>Thresholds: {(goal as TimeOnPageGoal).thresholds.map(t => `${t}s`).join(', ')}</div>
                            </div>
                          )}
                          
                          {(goal.type === 'element-visibility' || goal.type === 'hover') && (
                            <div className="text-xs text-muted-foreground">
                              <div>Element: <code className="bg-muted px-1 rounded">{goal.selector}</code></div>
                            </div>
                          )}

                          {/* Progress bar */}
                          {goalProgress && (
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span>Progress</span>
                                <span>{Math.round(goalProgress.progress)}%</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div 
                                  className="bg-primary rounded-full h-2 transition-all"
                                  style={{ width: `${goalProgress.progress}%` }}
                                />
                              </div>
                              
                              {goalProgress.milestones.length > 0 && (
                                <div className="text-xs text-muted-foreground">
                                  {goalProgress.milestones.length} milestone{goalProgress.milestones.length !== 1 ? 's' : ''} reached
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics" className="flex-1 overflow-hidden mt-0 p-4 pt-2">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total Goals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{goals.length}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Completion Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {goals.length > 0 ? Math.round((progress.filter(p => p.isCompleted).length / goals.length) * 100) : 0}%
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {progress.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Goal Progress Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {progress.map((p) => {
                        const goal = goals.find(g => g.eventKey === p.goalId);
                        if (!goal) return null;
                        
                        return (
                          <div key={p.goalId} className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm">
                              <div className={`w-2 h-2 rounded-full ${p.isCompleted ? 'bg-green-500' : p.progress > 0 ? 'bg-yellow-500' : 'bg-gray-300'}`} />
                              <span>{goal.eventKey}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {Math.round(p.progress)}%
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create/Edit Goal Dialog */}
      <GoalDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        goal={editingGoal}
        goalType={selectedGoalType}
        onGoalTypeChange={setSelectedGoalType}
        onSave={handleSaveGoal}
      />
    </div>
  );
}

interface GoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: AnyAdvancedGoal | null;
  goalType: string;
  onGoalTypeChange: (type: string) => void;
  onSave: (goal: AnyAdvancedGoal) => void;
}

function GoalDialog({ open, onOpenChange, goal, goalType, onGoalTypeChange, onSave }: GoalDialogProps) {
  const [eventKey, setEventKey] = useState(goal?.eventKey || '');
  const [formData, setFormData] = useState<Record<string, any>>({});

  React.useEffect(() => {
    if (goal) {
      setEventKey(goal.eventKey);
      setFormData(goal);
    } else {
      setEventKey('');
      setFormData({});
    }
  }, [goal]);

  const handleSave = () => {
    if (!eventKey.trim()) return;

    const baseGoal = {
      eventKey: eventKey.trim(),
      ...formData
    };

    let goalToSave: AnyAdvancedGoal;

    switch (goalType) {
      case 'form-completion':
        goalToSave = {
          ...baseGoal,
          type: 'form-completion',
          formSelector: formData.formSelector || 'form',
          fieldSelectors: formData.fieldSelectors || undefined,
          submitSelector: formData.submitSelector || undefined,
          trackPartialCompletion: formData.trackPartialCompletion || false,
          completionThreshold: formData.completionThreshold || 100
        } as FormCompletionGoal;
        break;
        
      case 'scroll-depth':
        goalToSave = {
          ...baseGoal,
          type: 'scroll-depth',
          thresholds: formData.thresholds || [25, 50, 75, 100],
          trackTime: formData.trackTime || false,
          containerSelector: formData.containerSelector || undefined
        } as ScrollDepthGoal;
        break;
        
      case 'time-on-page':
        goalToSave = {
          ...baseGoal,
          type: 'time-on-page',
          thresholds: formData.thresholds || [30, 60, 300],
          trackActiveTime: formData.trackActiveTime || false,
          excludeIdleTime: formData.excludeIdleTime || false
        } as TimeOnPageGoal;
        break;
        
      default:
        goalToSave = {
          ...baseGoal,
          type: goalType as any,
          selector: formData.selector || '',
          path: formData.path || ''
        } as AnyAdvancedGoal;
    }

    onSave(goalToSave);
  };

  const goalTypeConfig = GOAL_TYPES.find(t => t.value === goalType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {goal ? 'Edit Goal' : 'Create New Goal'}
          </DialogTitle>
          <DialogDescription>
            Configure goal tracking for your experiment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="goalType">Goal Type</Label>
            <Select value={goalType} onValueChange={onGoalTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GOAL_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className="w-4 h-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {goalTypeConfig && (
              <p className="text-xs text-muted-foreground">
                {goalTypeConfig.description}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="eventKey">Event Key</Label>
            <Input
              id="eventKey"
              value={eventKey}
              onChange={(e) => setEventKey(e.target.value)}
              placeholder="e.g., signup_form_completed"
            />
          </div>

          {/* Goal-specific configuration */}
          {goalType === 'form-completion' && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="formSelector">Form Selector</Label>
                <Input
                  id="formSelector"
                  value={formData.formSelector || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, formSelector: e.target.value }))}
                  placeholder="form, #signup-form, .contact-form"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="completionThreshold">Completion Threshold (%)</Label>
                <Input
                  id="completionThreshold"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.completionThreshold || 100}
                  onChange={(e) => setFormData(prev => ({ ...prev, completionThreshold: parseInt(e.target.value) }))}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="trackPartial"
                  checked={formData.trackPartialCompletion || false}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, trackPartialCompletion: checked }))}
                />
                <Label htmlFor="trackPartial" className="text-sm">Track partial completion</Label>
              </div>
            </div>
          )}

          {goalType === 'scroll-depth' && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="thresholds">Scroll Thresholds (%)</Label>
                <Input
                  id="thresholds"
                  value={(formData.thresholds || [25, 50, 75, 100]).join(', ')}
                  onChange={(e) => {
                    const values = e.target.value.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v));
                    setFormData(prev => ({ ...prev, thresholds: values }));
                  }}
                  placeholder="25, 50, 75, 100"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="trackTime"
                  checked={formData.trackTime || false}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, trackTime: checked }))}
                />
                <Label htmlFor="trackTime" className="text-sm">Track time to reach threshold</Label>
              </div>
            </div>
          )}

          {goalType === 'time-on-page' && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="timeThresholds">Time Thresholds (seconds)</Label>
                <Input
                  id="timeThresholds"
                  value={(formData.thresholds || [30, 60, 300]).join(', ')}
                  onChange={(e) => {
                    const values = e.target.value.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v));
                    setFormData(prev => ({ ...prev, thresholds: values }));
                  }}
                  placeholder="30, 60, 300"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="trackActiveTime"
                  checked={formData.trackActiveTime || false}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, trackActiveTime: checked }))}
                />
                <Label htmlFor="trackActiveTime" className="text-sm">Track only active time</Label>
              </div>
            </div>
          )}

          {(goalType === 'click' || goalType === 'element-visibility' || goalType === 'hover') && (
            <div className="space-y-2">
              <Label htmlFor="selector">Element Selector</Label>
              <Input
                id="selector"
                value={formData.selector || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, selector: e.target.value }))}
                placeholder=".cta-button, #signup-btn, [data-track='click']"
              />
            </div>
          )}

          {goalType === 'pageview' && (
            <div className="space-y-2">
              <Label htmlFor="path">Page Path</Label>
              <Input
                id="path"
                value={formData.path || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, path: e.target.value }))}
                placeholder="/thank-you, /checkout/complete"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!eventKey.trim()}>
            {goal ? 'Update Goal' : 'Create Goal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
