import type { WebExpGoal } from '@webexp/patch-engine';
import { safeResolve } from '@webexp/patch-engine';

export interface GoalTracker {
  bind(goals: WebExpGoal[], trackingFunction: (eventKey: string, data?: any) => void): void;
  unbind(): void;
  getBindings(): WebExpGoal[];
}

interface GoalBinding {
  goal: WebExpGoal;
  handler: (event: Event) => void;
  elements?: Element[];
}

/**
 * Goal tracker for web experiments
 */
export function createGoalTracker(): GoalTracker {
  let bindings: GoalBinding[] = [];
  let trackingFunction: ((eventKey: string, data?: any) => void) | null = null;
  let currentPath = window.location.pathname;
  
  return {
    bind(goals: WebExpGoal[], trackFunction: (eventKey: string, data?: any) => void): void {
      // Unbind existing goals
      this.unbind();
      
      trackingFunction = trackFunction;
      
      // Bind new goals
      goals.forEach(goal => {
        const binding = createGoalBinding(goal, trackFunction);
        if (binding) {
          bindings.push(binding);
        }
      });
      
      // Setup pageview tracking if needed
      const pageviewGoals = goals.filter(goal => goal.type === 'pageview');
      if (pageviewGoals.length > 0) {
        setupPageviewTracking(pageviewGoals, trackFunction);
      }
      
      console.info(`[WebExp] Bound ${bindings.length} goals`);
    },
    
    unbind(): void {
      // Remove click listeners
      bindings.forEach(binding => {
        if (binding.goal.type === 'click' && binding.elements) {
          binding.elements.forEach(element => {
            element.removeEventListener('click', binding.handler);
          });
        }
      });
      
      // Remove pageview listeners
      removePageviewTracking();
      
      bindings = [];
      trackingFunction = null;
      
      console.info('[WebExp] Unbound all goals');
    },
    
    getBindings(): WebExpGoal[] {
      return bindings.map(binding => binding.goal);
    }
  };
}

function createGoalBinding(goal: WebExpGoal, trackFunction: (eventKey: string, data?: any) => void): GoalBinding | null {
  if (goal.type === 'click') {
    return createClickGoalBinding(goal, trackFunction);
  }
  // Pageview goals are handled separately
  return null;
}

function createClickGoalBinding(
  goal: { type: 'click'; selector: string; eventKey: string },
  trackFunction: (eventKey: string, data?: any) => void
): GoalBinding | null {
  const elements = safeResolve(goal.selector);
  
  if (elements.length === 0) {
    console.warn(`[WebExp] No elements found for click goal selector: ${goal.selector}`);
    return null;
  }
  
  const handler = (event: Event) => {
    const target = event.target as Element;
    
    // Track the click event
    trackFunction(goal.eventKey, {
      selector: goal.selector,
      tagName: target.tagName.toLowerCase(),
      href: target.getAttribute('href'),
      text: target.textContent?.trim().substring(0, 100)
    });
    
    console.info(`[WebExp] Click goal triggered: ${goal.eventKey}`);
  };
  
  // Add event listeners
  elements.forEach(element => {
    element.addEventListener('click', handler, { passive: true });
  });
  
  return {
    goal,
    handler,
    elements
  };
}

// Pageview tracking state
let pageviewTrackingEnabled = false;
let pageviewGoals: Array<{ type: 'pageview'; path: string; eventKey: string }> = [];
let pageviewTrackFunction: ((eventKey: string, data?: any) => void) | null = null;
let currentPath = window.location.pathname;

function setupPageviewTracking(
  goals: Array<{ type: 'pageview'; path: string; eventKey: string }>,
  trackFunction: (eventKey: string, data?: any) => void
): void {
  pageviewGoals = goals;
  pageviewTrackFunction = trackFunction;
  
  if (!pageviewTrackingEnabled) {
    // Listen for navigation changes
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      handlePageview();
    };
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      handlePageview();
    };
    
    window.addEventListener('popstate', handlePageview);
    
    // Store original functions for cleanup
    (window as any).__webexpOriginalPushState = originalPushState;
    (window as any).__webexpOriginalReplaceState = originalReplaceState;
    
    pageviewTrackingEnabled = true;
    
    // Track initial pageview
    handlePageview();
  }
}

function removePageviewTracking(): void {
  if (!pageviewTrackingEnabled) return;
  
  // Restore original functions
  if ((window as any).__webexpOriginalPushState) {
    history.pushState = (window as any).__webexpOriginalPushState;
    delete (window as any).__webexpOriginalPushState;
  }
  
  if ((window as any).__webexpOriginalReplaceState) {
    history.replaceState = (window as any).__webexpOriginalReplaceState;
    delete (window as any).__webexpOriginalReplaceState;
  }
  
  window.removeEventListener('popstate', handlePageview);
  
  pageviewTrackingEnabled = false;
  pageviewGoals = [];
  pageviewTrackFunction = null;
}

function handlePageview(): void {
  const newPath = window.location.pathname;
  
  // Check if path changed
  if (newPath === currentPath) {
    return;
  }
  
  currentPath = newPath;
  
  // Check if any pageview goals match the current path
  pageviewGoals.forEach(goal => {
    if (pathMatches(currentPath, goal.path)) {
      if (pageviewTrackFunction) {
        pageviewTrackFunction(goal.eventKey, {
          path: currentPath,
          url: window.location.href,
          referrer: document.referrer
        });
        
        console.info(`[WebExp] Pageview goal triggered: ${goal.eventKey} for path ${currentPath}`);
      }
    }
  });
}

function pathMatches(currentPath: string, goalPath: string): boolean {
  // Exact match
  if (currentPath === goalPath) {
    return true;
  }
  
  // Wildcard matching
  if (goalPath.includes('*')) {
    const pattern = goalPath
      .replace(/\*/g, '.*')
      .replace(/\?/g, '\\?');
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(currentPath);
  }
  
  // Prefix matching (if goal path ends with /)
  if (goalPath.endsWith('/')) {
    return currentPath.startsWith(goalPath);
  }
  
  return false;
}
