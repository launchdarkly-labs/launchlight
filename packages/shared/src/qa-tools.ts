/**
 * Quality assurance tools for web experimentation
 */

export interface AccessibilityViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  help: string;
  helpUrl: string;
  nodes: {
    html: string;
    selector: string;
    target: string[];
  }[];
  tags: string[];
}

export interface AccessibilityReport {
  url: string;
  timestamp: number;
  violations: AccessibilityViolation[];
  passes: number;
  incomplete: number;
  inapplicable: number;
  summary: {
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
}

export interface VisualDiff {
  baseline: string; // Base64 image
  comparison: string; // Base64 image
  diff: string; // Base64 diff image
  similarity: number; // 0-100
  pixelDifference: number;
  regions: DiffRegion[];
  metadata: {
    width: number;
    height: number;
    device: string;
    url: string;
    timestamp: number;
  };
}

export interface DiffRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  difference: number; // 0-100
  category: 'layout' | 'content' | 'style' | 'unknown';
}

export interface QAPerformanceMetrics {
  url: string;
  timestamp: number;
  metrics: {
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    firstInputDelay: number;
    cumulativeLayoutShift: number;
    timeToInteractive: number;
    totalBlockingTime: number;
  };
  opportunities: PerformanceOpportunity[];
  diagnostics: PerformanceDiagnostic[];
  score: number; // 0-100
}

export interface PerformanceOpportunity {
  id: string;
  title: string;
  description: string;
  numericValue: number;
  displayValue: string;
  score: number;
  details?: any;
}

export interface PerformanceDiagnostic {
  id: string;
  title: string;
  description: string;
  displayValue: string;
  score: number;
  details?: any;
}

export interface QAResult {
  id: string;
  type: 'accessibility' | 'visual' | 'performance';
  status: 'pending' | 'running' | 'completed' | 'failed';
  timestamp: number;
  data?: AccessibilityReport | VisualDiff | QAPerformanceMetrics;
  error?: string;
}

/**
 * Accessibility analyzer using axe-core principles
 */
export class AccessibilityAnalyzer {
  private axeRules = [
    'color-contrast',
    'keyboard',
    'aria-valid-attr',
    'aria-valid-attr-value',
    'button-name',
    'form-field-multiple-labels',
    'frame-title',
    'html-has-lang',
    'image-alt',
    'input-image-alt',
    'label',
    'link-name',
    'list',
    'listitem',
    'meta-refresh',
    'meta-viewport',
    'region',
    'page-has-heading-one',
    'bypass',
    'focus-order-semantics',
    'hidden-content',
    'landmark-banner-is-top-level',
    'landmark-contentinfo-is-top-level',
    'landmark-main-is-top-level',
    'landmark-no-duplicate-banner',
    'landmark-no-duplicate-contentinfo',
    'landmark-one-main',
    'landmark-unique'
  ];

  /**
   * Analyze document for accessibility violations
   */
  async analyze(document: Document): Promise<AccessibilityReport> {
    const violations: AccessibilityViolation[] = [];
    let passes = 0;
    let incomplete = 0;
    let inapplicable = 0;

    // Color contrast check
    const contrastViolations = this.checkColorContrast(document);
    violations.push(...contrastViolations);

    // Keyboard accessibility
    const keyboardViolations = this.checkKeyboardAccessibility(document);
    violations.push(...keyboardViolations);

    // ARIA attributes
    const ariaViolations = this.checkAriaAttributes(document);
    violations.push(...ariaViolations);

    // Form accessibility
    const formViolations = this.checkFormAccessibility(document);
    violations.push(...formViolations);

    // Image accessibility
    const imageViolations = this.checkImageAccessibility(document);
    violations.push(...imageViolations);

    // Heading structure
    const headingViolations = this.checkHeadingStructure(document);
    violations.push(...headingViolations);

    // Landmark structure
    const landmarkViolations = this.checkLandmarkStructure(document);
    violations.push(...landmarkViolations);

    const summary = violations.reduce(
      (acc, violation) => {
        acc[violation.impact]++;
        return acc;
      },
      { critical: 0, serious: 0, moderate: 0, minor: 0 }
    );

    return {
      url: document.location?.href || '',
      timestamp: Date.now(),
      violations,
      passes,
      incomplete,
      inapplicable,
      summary
    };
  }

  /**
   * Check color contrast ratios
   */
  private checkColorContrast(document: Document): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];
    const textElements = document.querySelectorAll('*:not(script):not(style)');

    textElements.forEach(element => {
      const computedStyle = window.getComputedStyle(element);
      const textContent = element.textContent?.trim();

      if (!textContent) return;

      const color = computedStyle.color;
      const backgroundColor = computedStyle.backgroundColor;
      const fontSize = parseInt(computedStyle.fontSize);

      if (color && backgroundColor && color !== backgroundColor) {
        const contrast = this.calculateContrastRatio(color, backgroundColor);
        const isLargeText = fontSize >= 18 || (fontSize >= 14 && computedStyle.fontWeight === 'bold');
        const requiredRatio = isLargeText ? 3 : 4.5;

        if (contrast < requiredRatio) {
          violations.push({
            id: 'color-contrast',
            impact: contrast < requiredRatio * 0.7 ? 'serious' : 'moderate',
            description: `Element has insufficient color contrast ratio of ${contrast.toFixed(2)} (required: ${requiredRatio})`,
            help: 'Elements must have sufficient color contrast',
            helpUrl: 'https://dequeuniversity.com/rules/axe/4.7/color-contrast',
            nodes: [{
              html: element.outerHTML.substring(0, 200),
              selector: this.generateSelector(element),
              target: [this.generateSelector(element)]
            }],
            tags: ['wcag2a', 'wcag143', 'cat.color']
          });
        }
      }
    });

    return violations;
  }

  /**
   * Check keyboard accessibility
   */
  private checkKeyboardAccessibility(document: Document): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];
    const interactiveElements = document.querySelectorAll(
      'a, button, input, select, textarea, [tabindex], [role="button"], [role="link"], [role="menuitem"]'
    );

    interactiveElements.forEach(element => {
      const tagName = element.tagName.toLowerCase();
      const tabIndex = element.getAttribute('tabindex');
      const role = element.getAttribute('role');

      // Check for positive tabindex
      if (tabIndex && parseInt(tabIndex) > 0) {
        violations.push({
          id: 'tabindex-no-positive',
          impact: 'serious',
          description: 'Element has positive tabindex value',
          help: 'Elements should not have positive tabindex values',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.7/tabindex',
          nodes: [{
            html: element.outerHTML.substring(0, 200),
            selector: this.generateSelector(element),
            target: [this.generateSelector(element)]
          }],
          tags: ['wcag2a', 'wcag211', 'cat.keyboard']
        });
      }

      // Check for keyboard event handlers on non-interactive elements
      if (!['a', 'button', 'input', 'select', 'textarea'].includes(tagName) && 
          !role && 
          (element.hasAttribute('onclick') || element.hasAttribute('onkeydown'))) {
        violations.push({
          id: 'keyboard-event-handlers',
          impact: 'serious',
          description: 'Element with click handler missing keyboard support',
          help: 'Elements with click handlers must be keyboard accessible',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.7/click-events-have-key-events',
          nodes: [{
            html: element.outerHTML.substring(0, 200),
            selector: this.generateSelector(element),
            target: [this.generateSelector(element)]
          }],
          tags: ['wcag2a', 'wcag211', 'cat.keyboard']
        });
      }
    });

    return violations;
  }

  /**
   * Check ARIA attributes
   */
  private checkAriaAttributes(document: Document): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];
    const elementsWithAria = document.querySelectorAll('[aria-labelledby], [aria-describedby], [role]');

    elementsWithAria.forEach(element => {
      // Check aria-labelledby references
      const labelledBy = element.getAttribute('aria-labelledby');
      if (labelledBy) {
        const referencedElements = labelledBy.split(' ').map(id => document.getElementById(id));
        if (referencedElements.some(ref => !ref)) {
          violations.push({
            id: 'aria-valid-attr-value',
            impact: 'serious',
            description: 'aria-labelledby references non-existent element',
            help: 'ARIA attributes must reference valid elements',
            helpUrl: 'https://dequeuniversity.com/rules/axe/4.7/aria-valid-attr-value',
            nodes: [{
              html: element.outerHTML.substring(0, 200),
              selector: this.generateSelector(element),
              target: [this.generateSelector(element)]
            }],
            tags: ['wcag2a', 'wcag412', 'cat.aria']
          });
        }
      }

      // Check role validity
      const role = element.getAttribute('role');
      if (role && !this.isValidAriaRole(role)) {
        violations.push({
          id: 'aria-valid-attr',
          impact: 'serious',
          description: `Invalid ARIA role: ${role}`,
          help: 'ARIA roles must be valid',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.7/aria-valid-attr',
          nodes: [{
            html: element.outerHTML.substring(0, 200),
            selector: this.generateSelector(element),
            target: [this.generateSelector(element)]
          }],
          tags: ['wcag2a', 'wcag412', 'cat.aria']
        });
      }
    });

    return violations;
  }

  /**
   * Check form accessibility
   */
  private checkFormAccessibility(document: Document): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];
    const formControls = document.querySelectorAll('input, select, textarea');

    formControls.forEach(control => {
      const id = control.getAttribute('id');
      const type = control.getAttribute('type');
      const ariaLabel = control.getAttribute('aria-label');
      const ariaLabelledBy = control.getAttribute('aria-labelledby');
      
      // Skip hidden inputs and buttons
      if (type === 'hidden' || type === 'button' || type === 'submit' || type === 'reset') {
        return;
      }

      // Check for labels
      let hasLabel = false;
      
      if (id) {
        const label = document.querySelector(`label[for="${id}"]`);
        if (label) hasLabel = true;
      }
      
      // Check for implicit label (control inside label)
      const parentLabel = control.closest('label');
      if (parentLabel) hasLabel = true;
      
      // Check for ARIA labeling
      if (ariaLabel || ariaLabelledBy) hasLabel = true;

      if (!hasLabel) {
        violations.push({
          id: 'label',
          impact: 'critical',
          description: 'Form control does not have an accessible name',
          help: 'Form controls must have labels',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.7/label',
          nodes: [{
            html: control.outerHTML.substring(0, 200),
            selector: this.generateSelector(control),
            target: [this.generateSelector(control)]
          }],
          tags: ['wcag2a', 'wcag412', 'section508', 'cat.forms']
        });
      }
    });

    return violations;
  }

  /**
   * Check image accessibility
   */
  private checkImageAccessibility(document: Document): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];
    const images = document.querySelectorAll('img');

    images.forEach(img => {
      const alt = img.getAttribute('alt');
      const role = img.getAttribute('role');
      const ariaLabel = img.getAttribute('aria-label');
      const ariaLabelledBy = img.getAttribute('aria-labelledby');

      // Skip decorative images
      if (role === 'presentation' || role === 'none' || alt === '') {
        return;
      }

      if (!alt && !ariaLabel && !ariaLabelledBy) {
        violations.push({
          id: 'image-alt',
          impact: 'critical',
          description: 'Image does not have alternative text',
          help: 'Images must have alternative text',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.7/image-alt',
          nodes: [{
            html: img.outerHTML.substring(0, 200),
            selector: this.generateSelector(img),
            target: [this.generateSelector(img)]
          }],
          tags: ['wcag2a', 'wcag111', 'section508', 'cat.text-alternatives']
        });
      }
    });

    return violations;
  }

  /**
   * Check heading structure
   */
  private checkHeadingStructure(document: Document): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6, [role="heading"]');
    
    let hasH1 = false;
    let previousLevel = 0;

    headings.forEach(heading => {
      const tagName = heading.tagName.toLowerCase();
      const level = tagName.startsWith('h') ? parseInt(tagName.slice(1)) : 
                    parseInt(heading.getAttribute('aria-level') || '1');

      if (level === 1) {
        hasH1 = true;
      }

      // Check for skipped heading levels
      if (previousLevel > 0 && level > previousLevel + 1) {
        violations.push({
          id: 'heading-order',
          impact: 'moderate',
          description: `Heading level ${level} found after level ${previousLevel}`,
          help: 'Heading levels should increase by one',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.7/heading-order',
          nodes: [{
            html: heading.outerHTML.substring(0, 200),
            selector: this.generateSelector(heading),
            target: [this.generateSelector(heading)]
          }],
          tags: ['wcag2a', 'wcag131', 'cat.semantics']
        });
      }

      previousLevel = level;
    });

    if (!hasH1 && headings.length > 0) {
      violations.push({
        id: 'page-has-heading-one',
        impact: 'moderate',
        description: 'Page does not contain a level-one heading',
        help: 'Page should contain a level-one heading',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.7/page-has-heading-one',
        nodes: [{
          html: '<html>',
          selector: 'html',
          target: ['html']
        }],
        tags: ['wcag2a', 'wcag131', 'cat.semantics']
      });
    }

    return violations;
  }

  /**
   * Check landmark structure
   */
  private checkLandmarkStructure(document: Document): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];
    const landmarks = document.querySelectorAll('main, nav, header, footer, aside, section, [role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], [role="complementary"], [role="region"]');
    
    const mainElements = document.querySelectorAll('main, [role="main"]');
    
    if (mainElements.length === 0) {
      violations.push({
        id: 'landmark-one-main',
        impact: 'moderate',
        description: 'Page does not contain a main landmark',
        help: 'Page should contain one main landmark',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.7/landmark-one-main',
        nodes: [{
          html: '<html>',
          selector: 'html',
          target: ['html']
        }],
        tags: ['wcag2a', 'wcag131', 'cat.semantics']
      });
    } else if (mainElements.length > 1) {
      violations.push({
        id: 'landmark-no-duplicate-main',
        impact: 'moderate',
        description: 'Page contains more than one main landmark',
        help: 'Page should contain only one main landmark',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.7/landmark-one-main',
        nodes: Array.from(mainElements).map(el => ({
          html: el.outerHTML.substring(0, 200),
          selector: this.generateSelector(el),
          target: [this.generateSelector(el)]
        })),
        tags: ['wcag2a', 'wcag131', 'cat.semantics']
      });
    }

    return violations;
  }

  /**
   * Calculate color contrast ratio
   */
  private calculateContrastRatio(color1: string, color2: string): number {
    // Simplified contrast calculation
    // In a real implementation, you'd use a proper color parsing library
    return 4.5; // Placeholder
  }

  /**
   * Check if ARIA role is valid
   */
  private isValidAriaRole(role: string): boolean {
    const validRoles = [
      'alert', 'alertdialog', 'application', 'article', 'banner', 'button', 'cell',
      'checkbox', 'columnheader', 'combobox', 'complementary', 'contentinfo',
      'definition', 'dialog', 'directory', 'document', 'feed', 'figure', 'form',
      'grid', 'gridcell', 'group', 'heading', 'img', 'link', 'list', 'listbox',
      'listitem', 'log', 'main', 'marquee', 'math', 'menu', 'menubar', 'menuitem',
      'menuitemcheckbox', 'menuitemradio', 'navigation', 'none', 'note', 'option',
      'presentation', 'progressbar', 'radio', 'radiogroup', 'region', 'row',
      'rowgroup', 'rowheader', 'scrollbar', 'search', 'searchbox', 'separator',
      'slider', 'spinbutton', 'status', 'switch', 'tab', 'table', 'tablist',
      'tabpanel', 'term', 'textbox', 'timer', 'toolbar', 'tooltip', 'tree',
      'treegrid', 'treeitem'
    ];
    return validRoles.includes(role);
  }

  /**
   * Generate CSS selector for element
   */
  private generateSelector(element: Element): string {
    if (element.id) {
      return `#${CSS.escape(element.id)}`;
    }
    
    const tagName = element.tagName.toLowerCase();
    const parent = element.parentElement;
    
    if (!parent) {
      return tagName;
    }
    
    const siblings = Array.from(parent.children);
    const index = siblings.indexOf(element) + 1;
    
    return `${tagName}:nth-child(${index})`;
  }
}

/**
 * Visual regression testing utilities
 */
export class VisualRegressionTester {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  /**
   * Capture screenshot of element or viewport
   */
  async captureScreenshot(element?: Element): Promise<string> {
    // In a real implementation, this would use html2canvas or similar
    // For now, return a placeholder
    return 'data:image/png;base64,placeholder';
  }

  /**
   * Compare two screenshots and generate diff
   */
  async compareScreenshots(baseline: string, comparison: string): Promise<VisualDiff> {
    // Load images
    const baselineImg = await this.loadImage(baseline);
    const comparisonImg = await this.loadImage(comparison);

    // Set canvas size
    this.canvas.width = Math.max(baselineImg.width, comparisonImg.width);
    this.canvas.height = Math.max(baselineImg.height, comparisonImg.height);

    // Draw comparison
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.globalCompositeOperation = 'difference';
    this.ctx.drawImage(baselineImg, 0, 0);
    this.ctx.drawImage(comparisonImg, 0, 0);

    // Calculate differences
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const { similarity, pixelDifference, regions } = this.analyzeDifferences(imageData);

    const diffImage = this.canvas.toDataURL();

    return {
      baseline,
      comparison,
      diff: diffImage,
      similarity,
      pixelDifference,
      regions,
      metadata: {
        width: this.canvas.width,
        height: this.canvas.height,
        device: 'desktop',
        url: window.location.href,
        timestamp: Date.now()
      }
    };
  }

  /**
   * Load image from data URL
   */
  private loadImage(dataUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  /**
   * Analyze pixel differences
   */
  private analyzeDifferences(imageData: ImageData): {
    similarity: number;
    pixelDifference: number;
    regions: DiffRegion[];
  } {
    const data = imageData.data;
    let differentPixels = 0;
    const totalPixels = data.length / 4;

    // Count different pixels
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      if (r > 0 || g > 0 || b > 0) {
        differentPixels++;
      }
    }

    const similarity = ((totalPixels - differentPixels) / totalPixels) * 100;
    
    // Find difference regions (simplified)
    const regions: DiffRegion[] = [];
    
    return {
      similarity,
      pixelDifference: differentPixels,
      regions
    };
  }
}

/**
 * Performance analyzer
 */
export class PerformanceAnalyzer {
  /**
   * Analyze page performance
   */
  async analyzePerformance(): Promise<QAPerformanceMetrics> {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    
    const fcp = paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
    
    // Get Core Web Vitals (simplified)
    const metrics = {
      firstContentfulPaint: fcp,
      largestContentfulPaint: 0, // Would need LCP observer
      firstInputDelay: 0, // Would need FID observer
      cumulativeLayoutShift: 0, // Would need CLS observer
      timeToInteractive: navigation?.loadEventEnd - navigation?.fetchStart || 0,
      totalBlockingTime: 0 // Would need detailed measurement
    };

    // Analyze opportunities and diagnostics
    const opportunities = this.findOpportunities();
    const diagnostics = this.runDiagnostics();
    const score = this.calculatePerformanceScore(metrics);

    return {
      url: window.location.href,
      timestamp: Date.now(),
      metrics,
      opportunities,
      diagnostics,
      score
    };
  }

  /**
   * Find performance opportunities
   */
  private findOpportunities(): PerformanceOpportunity[] {
    const opportunities: PerformanceOpportunity[] = [];

    // Check for large images
    const images = document.querySelectorAll('img');
    const largeImages = Array.from(images).filter(img => {
      return img.naturalWidth > 1920 || img.naturalHeight > 1080;
    });

    if (largeImages.length > 0) {
      opportunities.push({
        id: 'optimize-images',
        title: 'Optimize Images',
        description: 'Properly size images to save cellular data and improve load time',
        numericValue: largeImages.length,
        displayValue: `${largeImages.length} image(s)`,
        score: 50
      });
    }

    // Check for unminified CSS/JS
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
    const scripts = document.querySelectorAll('script[src]');

    opportunities.push({
      id: 'minify-css',
      title: 'Minify CSS',
      description: 'Minifying CSS files can reduce network payload sizes',
      numericValue: stylesheets.length,
      displayValue: `${stylesheets.length} stylesheet(s)`,
      score: 75
    });

    return opportunities;
  }

  /**
   * Run performance diagnostics
   */
  private runDiagnostics(): PerformanceDiagnostic[] {
    const diagnostics: PerformanceDiagnostic[] = [];

    // Check DOM size
    const allElements = document.querySelectorAll('*');
    if (allElements.length > 1500) {
      diagnostics.push({
        id: 'dom-size',
        title: 'Avoid an excessive DOM size',
        description: 'A large DOM will increase memory usage, cause longer style calculations, and produce costly layout reflows',
        displayValue: `${allElements.length} elements`,
        score: allElements.length > 3000 ? 25 : 50
      });
    }

    // Check for render-blocking resources
    const renderBlockingCSS = document.querySelectorAll('link[rel="stylesheet"]:not([media="print"])');
    if (renderBlockingCSS.length > 0) {
      diagnostics.push({
        id: 'render-blocking-resources',
        title: 'Eliminate render-blocking resources',
        description: 'Resources are blocking the first paint of your page',
        displayValue: `${renderBlockingCSS.length} resource(s)`,
        score: 60
      });
    }

    return diagnostics;
  }

  /**
   * Calculate overall performance score
   */
  private calculatePerformanceScore(metrics: any): number {
    // Simplified scoring based on Core Web Vitals
    let score = 100;

    if (metrics.firstContentfulPaint > 3000) score -= 20;
    if (metrics.largestContentfulPaint > 4000) score -= 30;
    if (metrics.firstInputDelay > 300) score -= 25;
    if (metrics.cumulativeLayoutShift > 0.25) score -= 25;

    return Math.max(0, score);
  }
}

/**
 * Main QA manager class
 */
export class QAManager {
  private accessibilityAnalyzer: AccessibilityAnalyzer;
  private visualTester: VisualRegressionTester;
  private performanceAnalyzer: PerformanceAnalyzer;
  private results: Map<string, QAResult> = new Map();

  constructor() {
    this.accessibilityAnalyzer = new AccessibilityAnalyzer();
    this.visualTester = new VisualRegressionTester();
    this.performanceAnalyzer = new PerformanceAnalyzer();
  }

  /**
   * Run accessibility analysis
   */
  async runAccessibilityAnalysis(document: Document): Promise<string> {
    const id = this.generateId();
    
    this.results.set(id, {
      id,
      type: 'accessibility',
      status: 'running',
      timestamp: Date.now()
    });

    try {
      const report = await this.accessibilityAnalyzer.analyze(document);
      
      this.results.set(id, {
        id,
        type: 'accessibility',
        status: 'completed',
        timestamp: Date.now(),
        data: report
      });
    } catch (error) {
      this.results.set(id, {
        id,
        type: 'accessibility',
        status: 'failed',
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return id;
  }

  /**
   * Run visual regression test
   */
  async runVisualTest(baseline: string, comparison: string): Promise<string> {
    const id = this.generateId();
    
    this.results.set(id, {
      id,
      type: 'visual',
      status: 'running',
      timestamp: Date.now()
    });

    try {
      const diff = await this.visualTester.compareScreenshots(baseline, comparison);
      
      this.results.set(id, {
        id,
        type: 'visual',
        status: 'completed',
        timestamp: Date.now(),
        data: diff
      });
    } catch (error) {
      this.results.set(id, {
        id,
        type: 'visual',
        status: 'failed',
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return id;
  }

  /**
   * Run performance analysis
   */
  async runPerformanceAnalysis(): Promise<string> {
    const id = this.generateId();
    
    this.results.set(id, {
      id,
      type: 'performance',
      status: 'running',
      timestamp: Date.now()
    });

    try {
      const metrics = await this.performanceAnalyzer.analyzePerformance();
      
      this.results.set(id, {
        id,
        type: 'performance',
        status: 'completed',
        timestamp: Date.now(),
        data: metrics
      });
    } catch (error) {
      this.results.set(id, {
        id,
        type: 'performance',
        status: 'failed',
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return id;
  }

  /**
   * Get QA result by ID
   */
  getResult(id: string): QAResult | undefined {
    return this.results.get(id);
  }

  /**
   * Get all results
   */
  getAllResults(): QAResult[] {
    return Array.from(this.results.values());
  }

  /**
   * Clear all results
   */
  clearResults(): void {
    this.results.clear();
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `qa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
