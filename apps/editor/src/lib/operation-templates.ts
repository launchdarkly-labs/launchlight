/**
 * Operation templates for common web experimentation patterns
 */

import type { WebExpOp } from '@webexp/patch-engine';

export interface OperationTemplate {
  id: string;
  name: string;
  description: string;
  category: 'content' | 'style' | 'layout' | 'cta' | 'form' | 'navigation' | 'social-proof';
  tags: string[];
  operations: WebExpOp[];
  requiredSelectors: {
    name: string;
    description: string;
    example?: string;
  }[];
  preview?: string; // Base64 encoded thumbnail or URL
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedImpact: 'low' | 'medium' | 'high';
}

/**
 * Pre-built operation templates for common experimentation patterns
 */
export const OPERATION_TEMPLATES: OperationTemplate[] = [
  // Content Templates
  {
    id: 'headline-urgency',
    name: 'Add Urgency to Headlines',
    description: 'Add urgency words and time-sensitive language to improve conversion',
    category: 'content',
    tags: ['urgency', 'headlines', 'conversion', 'copywriting'],
    difficulty: 'beginner',
    estimatedImpact: 'medium',
    requiredSelectors: [
      {
        name: 'headline',
        description: 'Main headline or title element',
        example: 'h1, .hero-title, .main-headline'
      }
    ],
    operations: [
      {
        op: 'textReplace',
        selector: '{{headline}}',
        value: 'Limited Time: {{original}} - Act Now!'
      },
      {
        op: 'classAdd',
        selector: '{{headline}}',
        value: 'urgency-text'
      },
      {
        op: 'styleSet',
        selector: '{{headline}}',
        name: 'color',
        value: '#d63384'
      }
    ]
  },

  {
    id: 'social-proof-badge',
    name: 'Add Social Proof Badge',
    description: 'Insert customer count or rating badge near CTA to build trust',
    category: 'social-proof',
    tags: ['trust', 'social-proof', 'conversion', 'testimonials'],
    difficulty: 'beginner',
    estimatedImpact: 'high',
    requiredSelectors: [
      {
        name: 'cta',
        description: 'Call-to-action button or section',
        example: '.cta-button, .signup-btn, .purchase-btn'
      }
    ],
    operations: [
      {
        op: 'insertHTML',
        selector: '{{cta}}',
        value: '<div class="social-proof-badge" style="display: flex; align-items: center; gap: 8px; margin-top: 12px; font-size: 14px; color: #6b7280;"><span style="color: #10b981;">✓</span> Trusted by 50,000+ customers</div>'
      }
    ]
  },

  // CTA Templates
  {
    id: 'cta-button-enhancement',
    name: 'Enhanced CTA Button',
    description: 'Transform basic buttons into high-converting CTAs with color, copy, and visual enhancements',
    category: 'cta',
    tags: ['buttons', 'conversion', 'design', 'cta'],
    difficulty: 'beginner',
    estimatedImpact: 'high',
    requiredSelectors: [
      {
        name: 'button',
        description: 'Primary call-to-action button',
        example: '.btn-primary, .cta-button, button[type="submit"]'
      }
    ],
    operations: [
      {
        op: 'textReplace',
        selector: '{{button}}',
        value: 'Get Instant Access - Free!'
      },
      {
        op: 'styleSet',
        selector: '{{button}}',
        name: 'background',
        value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      },
      {
        op: 'styleSet',
        selector: '{{button}}',
        name: 'border',
        value: 'none'
      },
      {
        op: 'styleSet',
        selector: '{{button}}',
        name: 'border-radius',
        value: '8px'
      },
      {
        op: 'styleSet',
        selector: '{{button}}',
        name: 'padding',
        value: '16px 32px'
      },
      {
        op: 'styleSet',
        selector: '{{button}}',
        name: 'font-weight',
        value: 'bold'
      },
      {
        op: 'styleSet',
        selector: '{{button}}',
        name: 'text-transform',
        value: 'uppercase'
      },
      {
        op: 'styleSet',
        selector: '{{button}}',
        name: 'letter-spacing',
        value: '0.5px'
      },
      {
        op: 'styleSet',
        selector: '{{button}}',
        name: 'box-shadow',
        value: '0 4px 15px rgba(102, 126, 234, 0.4)'
      },
      {
        op: 'styleSet',
        selector: '{{button}}',
        name: 'transition',
        value: 'all 0.3s ease'
      }
    ]
  },

  {
    id: 'multiple-cta-buttons',
    name: 'Add Secondary CTA Options',
    description: 'Provide multiple conversion paths with primary and secondary CTAs',
    category: 'cta',
    tags: ['conversion', 'options', 'choice', 'flexibility'],
    difficulty: 'intermediate',
    estimatedImpact: 'medium',
    requiredSelectors: [
      {
        name: 'ctaContainer',
        description: 'Container holding the CTA button(s)',
        example: '.cta-section, .hero-actions, .button-group'
      }
    ],
    operations: [
      {
        op: 'insertHTML',
        selector: '{{ctaContainer}}',
        value: '<div class="cta-options" style="display: flex; flex-direction: column; gap: 12px; align-items: center; margin-top: 16px;"><button class="secondary-cta" style="background: transparent; border: 2px solid #6b7280; color: #6b7280; padding: 12px 24px; border-radius: 6px; font-weight: 500; cursor: pointer;">View Demo First</button><p style="font-size: 12px; color: #9ca3af; margin: 0;">No credit card required</p></div>'
      }
    ]
  },

  // Style Templates
  {
    id: 'modernize-form',
    name: 'Modernize Form Design',
    description: 'Apply modern styling to forms with better spacing, colors, and visual hierarchy',
    category: 'form',
    tags: ['forms', 'design', 'modern', 'ux'],
    difficulty: 'intermediate',
    estimatedImpact: 'medium',
    requiredSelectors: [
      {
        name: 'form',
        description: 'Form container element',
        example: 'form, .signup-form, .contact-form'
      },
      {
        name: 'inputs',
        description: 'Form input fields',
        example: 'input[type="text"], input[type="email"], textarea'
      }
    ],
    operations: [
      {
        op: 'styleSet',
        selector: '{{form}}',
        name: 'background',
        value: '#ffffff'
      },
      {
        op: 'styleSet',
        selector: '{{form}}',
        name: 'padding',
        value: '32px'
      },
      {
        op: 'styleSet',
        selector: '{{form}}',
        name: 'border-radius',
        value: '12px'
      },
      {
        op: 'styleSet',
        selector: '{{form}}',
        name: 'box-shadow',
        value: '0 10px 25px rgba(0, 0, 0, 0.1)'
      },
      {
        op: 'styleSet',
        selector: '{{inputs}}',
        name: 'border',
        value: '2px solid #e5e7eb'
      },
      {
        op: 'styleSet',
        selector: '{{inputs}}',
        name: 'border-radius',
        value: '8px'
      },
      {
        op: 'styleSet',
        selector: '{{inputs}}',
        name: 'padding',
        value: '14px 16px'
      },
      {
        op: 'styleSet',
        selector: '{{inputs}}',
        name: 'font-size',
        value: '16px'
      },
      {
        op: 'styleSet',
        selector: '{{inputs}}',
        name: 'transition',
        value: 'border-color 0.2s ease'
      }
    ]
  },

  // Layout Templates
  {
    id: 'sticky-header',
    name: 'Make Header Sticky',
    description: 'Convert regular header to sticky navigation for better user experience',
    category: 'navigation',
    tags: ['navigation', 'sticky', 'ux', 'accessibility'],
    difficulty: 'intermediate',
    estimatedImpact: 'medium',
    requiredSelectors: [
      {
        name: 'header',
        description: 'Main header/navigation element',
        example: 'header, .main-nav, .navbar'
      }
    ],
    operations: [
      {
        op: 'styleSet',
        selector: '{{header}}',
        name: 'position',
        value: 'sticky'
      },
      {
        op: 'styleSet',
        selector: '{{header}}',
        name: 'top',
        value: '0'
      },
      {
        op: 'styleSet',
        selector: '{{header}}',
        name: 'z-index',
        value: '1000'
      },
      {
        op: 'styleSet',
        selector: '{{header}}',
        name: 'background-color',
        value: 'rgba(255, 255, 255, 0.95)'
      },
      {
        op: 'styleSet',
        selector: '{{header}}',
        name: 'backdrop-filter',
        value: 'blur(10px)'
      },
      {
        op: 'styleSet',
        selector: '{{header}}',
        name: 'transition',
        value: 'all 0.3s ease'
      },
      {
        op: 'styleSet',
        selector: '{{header}}',
        name: 'box-shadow',
        value: '0 2px 10px rgba(0, 0, 0, 0.1)'
      }
    ]
  },

  {
    id: 'center-content',
    name: 'Center Content Layout',
    description: 'Center main content with optimal reading width and spacing',
    category: 'layout',
    tags: ['layout', 'readability', 'spacing', 'typography'],
    difficulty: 'beginner',
    estimatedImpact: 'low',
    requiredSelectors: [
      {
        name: 'content',
        description: 'Main content container',
        example: 'main, .content, .container'
      }
    ],
    operations: [
      {
        op: 'styleSet',
        selector: '{{content}}',
        name: 'max-width',
        value: '800px'
      },
      {
        op: 'styleSet',
        selector: '{{content}}',
        name: 'margin',
        value: '0 auto'
      },
      {
        op: 'styleSet',
        selector: '{{content}}',
        name: 'padding',
        value: '0 24px'
      }
    ]
  },

  // Advanced Templates
  {
    id: 'progressive-form',
    name: 'Convert to Progressive Form',
    description: 'Transform long forms into multi-step progressive forms to reduce abandonment',
    category: 'form',
    tags: ['forms', 'progressive', 'ux', 'conversion', 'multi-step'],
    difficulty: 'advanced',
    estimatedImpact: 'high',
    requiredSelectors: [
      {
        name: 'form',
        description: 'Form container with multiple fields',
        example: 'form, .signup-form, .registration-form'
      },
      {
        name: 'fields',
        description: 'Form field groups to convert to steps',
        example: '.form-group, .field-group, .form-section'
      }
    ],
    operations: [
      {
        op: 'insertHTML',
        selector: '{{form}}',
        value: '<div class="form-progress" style="display: flex; justify-content: center; margin-bottom: 32px;"><div class="progress-bar" style="display: flex; align-items: center; gap: 8px;"><div class="step active" style="width: 32px; height: 32px; border-radius: 50%; background: #3b82f6; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold;">1</div><div style="width: 32px; height: 2px; background: #e5e7eb;"></div><div class="step" style="width: 32px; height: 32px; border-radius: 50%; background: #e5e7eb; color: #6b7280; display: flex; align-items: center; justify-content: center; font-weight: bold;">2</div><div style="width: 32px; height: 2px; background: #e5e7eb;"></div><div class="step" style="width: 32px; height: 32px; border-radius: 50%; background: #e5e7eb; color: #6b7280; display: flex; align-items: center; justify-content: center; font-weight: bold;">3</div></div></div>'
      },
      {
        op: 'insertHTML',
        selector: '{{form}}',
        value: '<div class="form-navigation" style="display: flex; justify-content: space-between; margin-top: 24px;"><button type="button" class="btn-prev" style="padding: 12px 24px; border: 2px solid #e5e7eb; background: white; border-radius: 6px; color: #6b7280;" disabled>Previous</button><button type="button" class="btn-next" style="padding: 12px 24px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-weight: 500;">Next Step</button></div>'
      }
    ]
  },

  {
    id: 'exit-intent-popup',
    name: 'Add Exit-Intent Popup',
    description: 'Create exit-intent popup to capture leaving visitors with special offer',
    category: 'cta',
    tags: ['exit-intent', 'popup', 'conversion', 'retention'],
    difficulty: 'advanced',
    estimatedImpact: 'high',
    requiredSelectors: [
      {
        name: 'body',
        description: 'Document body element',
        example: 'body'
      }
    ],
    operations: [
      {
        op: 'insertHTML',
        selector: '{{body}}',
        value: '<div id="exit-intent-popup" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); z-index: 9999; align-items: center; justify-content: center;"><div style="background: white; padding: 40px; border-radius: 12px; max-width: 500px; text-align: center; position: relative;"><button onclick="document.getElementById(\'exit-intent-popup\').style.display = \'none\'" style="position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 24px; cursor: pointer;">×</button><h2 style="margin-bottom: 16px; color: #1f2937;">Wait! Don\'t Miss Out</h2><p style="margin-bottom: 24px; color: #6b7280;">Get 20% off your first order when you subscribe to our newsletter</p><div style="display: flex; gap: 12px;"><input type="email" placeholder="Enter your email" style="flex: 1; padding: 12px; border: 2px solid #e5e7eb; border-radius: 6px;"><button style="padding: 12px 24px; background: #ef4444; color: white; border: none; border-radius: 6px; font-weight: bold;">Get 20% Off</button></div></div></div>'
      }
    ]
  }
];

/**
 * Template categories for organization
 */
export const TEMPLATE_CATEGORIES = {
  content: {
    name: 'Content & Copy',
    description: 'Headlines, text, and messaging improvements',
    icon: '📝'
  },
  style: {
    name: 'Visual Design',
    description: 'Colors, typography, and visual enhancements',
    icon: '🎨'
  },
  layout: {
    name: 'Layout & Structure',
    description: 'Page structure and element positioning',
    icon: '📐'
  },
  cta: {
    name: 'Call-to-Action',
    description: 'Buttons, forms, and conversion elements',
    icon: '🎯'
  },
  form: {
    name: 'Forms & Input',
    description: 'Form design and user input optimization',
    icon: '📋'
  },
  navigation: {
    name: 'Navigation & UX',
    description: 'Menu, navigation, and user experience',
    icon: '🧭'
  },
  'social-proof': {
    name: 'Social Proof',
    description: 'Trust signals and credibility elements',
    icon: '⭐'
  }
};

/**
 * Utility functions for working with templates
 */
export class TemplateEngine {
  /**
   * Replace template variables in operations
   */
  static applyTemplate(
    template: OperationTemplate, 
    selectorMappings: Record<string, string>
  ): WebExpOp[] {
    return template.operations.map(op => {
      const processedOp = { ...op };
      
      // Replace selector variables
      Object.entries(selectorMappings).forEach(([variable, selector]) => {
        const placeholder = `{{${variable}}}`;
        
        if ('selector' in processedOp && processedOp.selector.includes(placeholder)) {
          processedOp.selector = processedOp.selector.replace(placeholder, selector);
        }
        
        if ('targetSelector' in processedOp && processedOp.targetSelector?.includes(placeholder)) {
          processedOp.targetSelector = processedOp.targetSelector.replace(placeholder, selector);
        }
        
        if ('containerSelector' in processedOp && processedOp.containerSelector?.includes(placeholder)) {
          processedOp.containerSelector = processedOp.containerSelector.replace(placeholder, selector);
        }
        
        // Replace in operation values
        if ('value' in processedOp && typeof processedOp.value === 'string' && processedOp.value.includes(placeholder)) {
          processedOp.value = processedOp.value.replace(placeholder, selector);
        }
        
        if ('html' in processedOp && processedOp.html.includes(placeholder)) {
          processedOp.html = processedOp.html.replace(placeholder, selector);
        }
      });
      
      return processedOp;
    });
  }

  /**
   * Get templates by category
   */
  static getTemplatesByCategory(category: string): OperationTemplate[] {
    return OPERATION_TEMPLATES.filter(template => template.category === category);
  }

  /**
   * Search templates by tags or content
   */
  static searchTemplates(query: string): OperationTemplate[] {
    const lowercaseQuery = query.toLowerCase();
    
    return OPERATION_TEMPLATES.filter(template => 
      template.name.toLowerCase().includes(lowercaseQuery) ||
      template.description.toLowerCase().includes(lowercaseQuery) ||
      template.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  /**
   * Get templates by difficulty level
   */
  static getTemplatesByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): OperationTemplate[] {
    return OPERATION_TEMPLATES.filter(template => template.difficulty === difficulty);
  }

  /**
   * Get templates by estimated impact
   */
  static getTemplatesByImpact(impact: 'low' | 'medium' | 'high'): OperationTemplate[] {
    return OPERATION_TEMPLATES.filter(template => template.estimatedImpact === impact);
  }

  /**
   * Validate template selector mappings
   */
  static validateMappings(
    template: OperationTemplate, 
    mappings: Record<string, string>
  ): { valid: boolean; missing: string[] } {
    const requiredSelectors = template.requiredSelectors.map(req => req.name);
    const providedSelectors = Object.keys(mappings);
    const missing = requiredSelectors.filter(req => !providedSelectors.includes(req));
    
    return {
      valid: missing.length === 0,
      missing
    };
  }
}
