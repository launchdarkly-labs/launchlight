'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Shield,
  Eye,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  Camera,
  BarChart3,
  RefreshCw,
  Download,
  ExternalLink,
  Info,
  XCircle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { 
  QAManager,
  type QAResult,
  type AccessibilityReport,
  type VisualDiff,
  type PerformanceMetrics,
  type AccessibilityViolation
} from '@webexp/shared';

interface QAPanelProps {
  previewDocument?: Document;
  className?: string;
}

export function QAPanel({ previewDocument, className = '' }: QAPanelProps) {
  const [qaManager] = useState(() => new QAManager());
  const [results, setResults] = useState<QAResult[]>([]);
  const [isRunning, setIsRunning] = useState<Record<string, boolean>>({});
  const [baselineScreenshot, setBaselineScreenshot] = useState<string | null>(null);

  // Refresh results periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setResults(qaManager.getAllResults());
    }, 1000);

    return () => clearInterval(interval);
  }, [qaManager]);

  const handleRunAccessibility = useCallback(async () => {
    if (!previewDocument) {
      alert('No preview document available');
      return;
    }

    setIsRunning(prev => ({ ...prev, accessibility: true }));
    
    try {
      await qaManager.runAccessibilityAnalysis(previewDocument);
    } finally {
      setIsRunning(prev => ({ ...prev, accessibility: false }));
    }
  }, [qaManager, previewDocument]);

  const handleRunPerformance = useCallback(async () => {
    setIsRunning(prev => ({ ...prev, performance: true }));
    
    try {
      await qaManager.runPerformanceAnalysis();
    } finally {
      setIsRunning(prev => ({ ...prev, performance: false }));
    }
  }, [qaManager]);

  const handleCaptureBaseline = useCallback(async () => {
    setIsRunning(prev => ({ ...prev, baseline: true }));
    
    try {
      // In a real implementation, this would capture the preview iframe
      const screenshot = 'data:image/png;base64,placeholder-baseline';
      setBaselineScreenshot(screenshot);
    } finally {
      setIsRunning(prev => ({ ...prev, baseline: false }));
    }
  }, []);

  const handleRunVisualTest = useCallback(async () => {
    if (!baselineScreenshot) {
      alert('Please capture a baseline screenshot first');
      return;
    }

    setIsRunning(prev => ({ ...prev, visual: true }));
    
    try {
      // Capture current screenshot
      const currentScreenshot = 'data:image/png;base64,placeholder-current';
      await qaManager.runVisualTest(baselineScreenshot, currentScreenshot);
    } finally {
      setIsRunning(prev => ({ ...prev, visual: false }));
    }
  }, [qaManager, baselineScreenshot]);

  const handleClearResults = useCallback(() => {
    qaManager.clearResults();
    setResults([]);
  }, [qaManager]);

  const getLatestResult = (type: string): QAResult | undefined => {
    return results
      .filter(r => r.type === type)
      .sort((a, b) => b.timestamp - a.timestamp)[0];
  };

  const accessibilityResult = getLatestResult('accessibility');
  const visualResult = getLatestResult('visual');
  const performanceResult = getLatestResult('performance');

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b bg-background">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Quality Assurance</h2>
          <div className="flex items-center gap-2">
            <Button 
              onClick={handleClearResults} 
              size="sm" 
              variant="outline"
              disabled={results.length === 0}
            >
              Clear
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Shield className="w-4 h-4 text-blue-600" />
              <span>Accessibility</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {accessibilityResult?.status === 'completed' && accessibilityResult.data ? 
                `${(accessibilityResult.data as AccessibilityReport).violations.length} issues` :
                'Not tested'
              }
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Eye className="w-4 h-4 text-green-600" />
              <span>Visual</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {visualResult?.status === 'completed' && visualResult.data ?
                `${Math.round((visualResult.data as VisualDiff).similarity)}% similar` :
                'Not tested'
              }
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Zap className="w-4 h-4 text-orange-600" />
              <span>Performance</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {performanceResult?.status === 'completed' && performanceResult.data ?
                `Score: ${(performanceResult.data as PerformanceMetrics).score}` :
                'Not tested'
              }
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="accessibility" className="h-full flex flex-col">
          <TabsList className="mx-4 mt-4">
            <TabsTrigger value="accessibility" className="flex-1 text-xs">
              <Shield className="w-4 h-4 mr-2" />
              Accessibility
            </TabsTrigger>
            <TabsTrigger value="visual" className="flex-1 text-xs">
              <Eye className="w-4 h-4 mr-2" />
              Visual
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex-1 text-xs">
              <Zap className="w-4 h-4 mr-2" />
              Performance
            </TabsTrigger>
          </TabsList>

          {/* Accessibility Tab */}
          <TabsContent value="accessibility" className="flex-1 overflow-hidden mt-0 p-4 pt-2">
            <div className="space-y-4 h-full">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Accessibility Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    WCAG 2.1 AA compliance check
                  </p>
                </div>
                <Button 
                  onClick={handleRunAccessibility}
                  disabled={isRunning.accessibility || !previewDocument}
                  size="sm"
                >
                  {isRunning.accessibility ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Run Analysis
                    </>
                  )}
                </Button>
              </div>

              {accessibilityResult && (
                <AccessibilityResults result={accessibilityResult} />
              )}
            </div>
          </TabsContent>

          {/* Visual Tab */}
          <TabsContent value="visual" className="flex-1 overflow-hidden mt-0 p-4 pt-2">
            <div className="space-y-4 h-full">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Visual Regression Testing</h3>
                  <p className="text-sm text-muted-foreground">
                    Compare visual changes between versions
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={handleCaptureBaseline}
                    disabled={isRunning.baseline}
                    size="sm"
                    variant="outline"
                  >
                    {isRunning.baseline ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                  </Button>
                  <Button 
                    onClick={handleRunVisualTest}
                    disabled={isRunning.visual || !baselineScreenshot}
                    size="sm"
                  >
                    {isRunning.visual ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Comparing...
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Compare
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {!baselineScreenshot && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Capture a baseline screenshot first to enable visual comparison testing.
                  </AlertDescription>
                </Alert>
              )}

              {visualResult && (
                <VisualResults result={visualResult} />
              )}
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="flex-1 overflow-hidden mt-0 p-4 pt-2">
            <div className="space-y-4 h-full">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Performance Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    Core Web Vitals and optimization opportunities
                  </p>
                </div>
                <Button 
                  onClick={handleRunPerformance}
                  disabled={isRunning.performance}
                  size="sm"
                >
                  {isRunning.performance ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Run Analysis
                    </>
                  )}
                </Button>
              </div>

              {performanceResult && (
                <PerformanceResults result={performanceResult} />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function AccessibilityResults({ result }: { result: QAResult }) {
  if (result.status === 'failed') {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertDescription>
          Analysis failed: {result.error}
        </AlertDescription>
      </Alert>
    );
  }

  if (result.status !== 'completed' || !result.data) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Clock className="w-4 h-4" />
        <span>Analysis in progress...</span>
      </div>
    );
  }

  const report = result.data as AccessibilityReport;
  const { violations, summary } = report;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-red-600">{summary.critical}</div>
            <div className="text-xs text-muted-foreground">Critical</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-orange-600">{summary.serious}</div>
            <div className="text-xs text-muted-foreground">Serious</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-yellow-600">{summary.moderate}</div>
            <div className="text-xs text-muted-foreground">Moderate</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">{summary.minor}</div>
            <div className="text-xs text-muted-foreground">Minor</div>
          </CardContent>
        </Card>
      </div>

      {/* Violations List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Violations ({violations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {violations.length === 0 ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">No accessibility violations found</span>
            </div>
          ) : (
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {violations.map((violation, index) => (
                  <ViolationItem key={index} violation={violation} />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ViolationItem({ violation }: { violation: AccessibilityViolation }) {
  const impactColors = {
    critical: 'border-red-500 bg-red-50',
    serious: 'border-orange-500 bg-orange-50',
    moderate: 'border-yellow-500 bg-yellow-50',
    minor: 'border-blue-500 bg-blue-50'
  };

  return (
    <div className={`border-l-4 p-3 rounded ${impactColors[violation.impact]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs">
              {violation.impact}
            </Badge>
            <span className="font-medium text-sm">{violation.id}</span>
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            {violation.description}
          </p>
          <p className="text-xs text-muted-foreground">
            {violation.help}
          </p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0"
          onClick={() => window.open(violation.helpUrl, '_blank')}
        >
          <ExternalLink className="w-3 h-3" />
        </Button>
      </div>
      
      {violation.nodes.length > 0 && (
        <div className="mt-2 text-xs">
          <span className="text-muted-foreground">Affected elements: </span>
          <code className="bg-muted px-1 rounded">{violation.nodes[0].selector}</code>
          {violation.nodes.length > 1 && (
            <span className="text-muted-foreground"> and {violation.nodes.length - 1} more</span>
          )}
        </div>
      )}
    </div>
  );
}

function VisualResults({ result }: { result: QAResult }) {
  if (result.status === 'failed') {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertDescription>
          Visual comparison failed: {result.error}
        </AlertDescription>
      </Alert>
    );
  }

  if (result.status !== 'completed' || !result.data) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Clock className="w-4 h-4" />
        <span>Comparison in progress...</span>
      </div>
    );
  }

  const diff = result.data as VisualDiff;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-2xl font-bold">{Math.round(diff.similarity)}%</div>
              <div className="text-sm text-muted-foreground">Similarity</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-medium">{diff.pixelDifference}</div>
              <div className="text-sm text-muted-foreground">Different pixels</div>
            </div>
          </div>
          
          <Progress value={diff.similarity} className="h-2" />
          
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>0% (Different)</span>
            <span>100% (Identical)</span>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Images */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Baseline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-muted rounded flex items-center justify-center">
              <span className="text-xs text-muted-foreground">Baseline Image</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Current</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-muted rounded flex items-center justify-center">
              <span className="text-xs text-muted-foreground">Current Image</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Difference Regions */}
      {diff.regions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Difference Regions ({diff.regions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {diff.regions.map((region, index) => (
                  <div key={index} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                    <span>Region {index + 1}</span>
                    <Badge variant="outline" className="text-xs">
                      {Math.round(region.difference)}% different
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PerformanceResults({ result }: { result: QAResult }) {
  if (result.status === 'failed') {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertDescription>
          Performance analysis failed: {result.error}
        </AlertDescription>
      </Alert>
    );
  }

  if (result.status !== 'completed' || !result.data) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Clock className="w-4 h-4" />
        <span>Analysis in progress...</span>
      </div>
    );
  }

  const metrics = result.data as PerformanceMetrics;

  return (
    <div className="space-y-4">
      {/* Overall Score */}
      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-4xl font-bold mb-2">
            {metrics.score}
          </div>
          <div className="text-sm text-muted-foreground mb-4">
            Performance Score
          </div>
          <Progress value={metrics.score} className="h-3" />
        </CardContent>
      </Card>

      {/* Core Web Vitals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Core Web Vitals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold">
                {Math.round(metrics.metrics.firstContentfulPaint)}ms
              </div>
              <div className="text-xs text-muted-foreground">
                First Contentful Paint
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">
                {Math.round(metrics.metrics.largestContentfulPaint)}ms
              </div>
              <div className="text-xs text-muted-foreground">
                Largest Contentful Paint
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">
                {Math.round(metrics.metrics.firstInputDelay)}ms
              </div>
              <div className="text-xs text-muted-foreground">
                First Input Delay
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">
                {metrics.metrics.cumulativeLayoutShift.toFixed(3)}
              </div>
              <div className="text-xs text-muted-foreground">
                Cumulative Layout Shift
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Opportunities */}
      {metrics.opportunities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Opportunities ({metrics.opportunities.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-3">
                {metrics.opportunities.map((opportunity, index) => (
                  <div key={index} className="flex items-start justify-between p-2 border rounded">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{opportunity.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {opportunity.description}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {opportunity.displayValue}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {opportunity.score > 75 ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-xs">{opportunity.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
