import DOMPurify from 'dompurify';

/**
 * HTML sanitizer configuration for safe content insertion
 */
export const sanitizerConfig = {
  // Allowed tags for safe HTML insertion
  ALLOWED_TAGS: [
    'div', 'span', 'p', 'a', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'br', 'hr', 'strong', 'em', 'b', 'i', 'u',
    'blockquote', 'pre', 'code', 'small', 'sub', 'sup'
  ],
  
  // Allowed attributes
  ALLOWED_ATTR: [
    'id', 'class', 'href', 'src', 'alt', 'title', 'width', 'height',
    'data-*', 'aria-*', 'role'
  ],
  
  // Allowed protocols for links and images
  ALLOWED_URI_REGEXP: /^(?:(?:https?|ftp|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
  
  // Remove script tags and event handlers
  FORBID_TAGS: ['script', 'object', 'embed', 'link', 'style', 'meta'],
  FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur']
};

/**
 * Sanitize HTML content for safe insertion
 */
export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: sanitizerConfig.ALLOWED_TAGS,
    ALLOWED_ATTR: sanitizerConfig.ALLOWED_ATTR,
    ALLOWED_URI_REGEXP: sanitizerConfig.ALLOWED_URI_REGEXP,
    FORBID_TAGS: sanitizerConfig.FORBID_TAGS,
    FORBID_ATTR: sanitizerConfig.FORBID_ATTR,
    KEEP_CONTENT: true,
    USE_PROFILES: { html: true }
  });
}

/**
 * Validate if HTML is safe (returns sanitized version and validation result)
 */
export function validateHTML(html: string): { 
  sanitized: string; 
  isSafe: boolean; 
  removedContent?: string[] 
} {
  const original = html;
  const sanitized = sanitizeHTML(html);
  const isSafe = original === sanitized;
  
  let removedContent: string[] = [];
  if (!isSafe) {
    // Try to identify what was removed (basic heuristic)
    const originalTags: string[] = original.match(/<[^>]+>/g) || [];
    const sanitizedTags: string[] = sanitized.match(/<[^>]+>/g) || [];
    removedContent = originalTags.filter(tag => !sanitizedTags.includes(tag));
  }
  
  return {
    sanitized,
    isSafe,
    removedContent: removedContent.length > 0 ? removedContent : undefined
  };
}

/**
 * Check if content contains potentially dangerous elements
 */
export function hasDangerousContent(html: string): boolean {
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe\b/gi,
    /<object\b/gi,
    /<embed\b/gi,
    /<link\b/gi,
    /<meta\b/gi
  ];
  
  return dangerousPatterns.some(pattern => pattern.test(html));
}
