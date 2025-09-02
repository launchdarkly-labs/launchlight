/**
 * Advanced goal tracking for web experimentation
 */

import type { WebExpGoal } from '@webexp/patch-engine';

export interface AdvancedGoal extends WebExpGoal {
  type: 'click' | 'pageview' | 'form-completion' | 'scroll-depth' | 'time-on-page' | 'element-visibility' | 'hover' | 'video-play' | 'file-download';
}

export interface FormCompletionGoal extends AdvancedGoal {
  type: 'form-completion';
  formSelector: string;
  fieldSelectors?: string[];
  submitSelector?: string;
  validationRules?: {
    required?: string[];
    patterns?: Record<string, string>;
  };
  trackPartialCompletion?: boolean;
  completionThreshold?: number; // Percentage of fields completed
}

export interface ScrollDepthGoal extends AdvancedGoal {
  type: 'scroll-depth';
  thresholds: number[]; // Array of percentages (e.g., [25, 50, 75, 100])
  trackTime?: boolean; // Track time to reach each threshold
  containerSelector?: string; // Track scroll within specific container
}

export interface TimeOnPageGoal extends AdvancedGoal {
  type: 'time-on-page';
  thresholds: number[]; // Array of seconds (e.g., [10, 30, 60, 300])
  trackActiveTime?: boolean; // Only count time when page is active
  excludeIdleTime?: boolean; // Exclude time when user is idle
  idleThreshold?: number; // Seconds before considering user idle
}

export interface ElementVisibilityGoal extends AdvancedGoal {
  type: 'element-visibility';
  selector: string;
  threshold?: number; // Percentage of element visible (default 50%)
  duration?: number; // Minimum time visible in milliseconds
  trackFirstView?: boolean; // Track only first time visible
}

export interface HoverGoal extends AdvancedGoal {
  type: 'hover';
  selector: string;
  minDuration?: number; // Minimum hover duration in milliseconds
  trackRepeats?: boolean; // Track multiple hovers on same element
}

export interface VideoPlayGoal extends AdvancedGoal {
  type: 'video-play';
  videoSelector: string;
  trackProgress?: boolean; // Track play progress milestones
  progressThresholds?: number[]; // Array of percentages
  trackCompletion?: boolean;
}

export interface FileDownloadGoal extends AdvancedGoal {
  type: 'file-download';
  linkSelector?: string; // Specific download links
  fileTypes?: string[]; // Track specific file types (.pdf, .zip, etc.)
  trackAllDownloads?: boolean; // Track all download attempts
}

export type AnyAdvancedGoal = 
  | FormCompletionGoal 
  | ScrollDepthGoal 
  | TimeOnPageGoal 
  | ElementVisibilityGoal 
  | HoverGoal 
  | VideoPlayGoal 
  | FileDownloadGoal;

export interface GoalEvent {
  goalId: string;
  eventKey: string;
  timestamp: number;
  data: Record<string, any>;
  value?: number;
  metadata?: {
    url: string;
    userAgent: string;
    sessionId: string;
    experimentId?: string;
  };
}

export interface GoalProgress {
  goalId: string;
  progress: number; // 0-100
  milestones: {
    threshold: number;
    timestamp: number;
    data?: Record<string, any>;
  }[];
  isCompleted: boolean;
  completedAt?: number;
}

/**
 * Advanced goal tracking manager
 */
export class AdvancedGoalTracker {
  private goals: Map<string, AnyAdvancedGoal> = new Map();
  private progress: Map<string, GoalProgress> = new Map();
  private observers: Map<string, any> = new Map(); // Store various observers
  private timers: Map<string, number> = new Map();
  private startTime: number = Date.now();
  private lastActivity: number = Date.now();
  private isActive: boolean = true;
  private sessionId: string;

  constructor(private trackingFunction: (eventKey: string, data?: any) => void) {
    this.sessionId = this.generateSessionId();
    this.setupActivityTracking();
  }

  /**
   * Add goals to track
   */
  addGoals(goals: AnyAdvancedGoal[]): void {
    goals.forEach(goal => {
      this.goals.set(goal.eventKey, goal);
      this.initializeGoalTracking(goal);
    });
  }

  /**
   * Remove goal tracking
   */
  removeGoal(goalId: string): void {
    this.goals.delete(goalId);
    this.progress.delete(goalId);
    this.cleanupGoalTracking(goalId);
  }

  /**
   * Get progress for all goals
   */
  getProgress(): GoalProgress[] {
    return Array.from(this.progress.values());
  }

  /**
   * Get progress for specific goal
   */
  getGoalProgress(goalId: string): GoalProgress | undefined {
    return this.progress.get(goalId);
  }

  /**
   * Stop all tracking and cleanup
   */
  destroy(): void {
    this.goals.clear();
    this.progress.clear();
    
    // Clear all observers and timers
    this.observers.forEach(observer => {
      if (observer && typeof observer.disconnect === 'function') {
        observer.disconnect();
      }
    });
    this.observers.clear();
    
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
  }

  /**
   * Initialize tracking for a specific goal
   */
  private initializeGoalTracking(goal: AnyAdvancedGoal): void {
    // Initialize progress tracking
    this.progress.set(goal.eventKey, {
      goalId: goal.eventKey,
      progress: 0,
      milestones: [],
      isCompleted: false
    });

    switch (goal.type) {
      case 'form-completion':
        this.trackFormCompletion(goal as FormCompletionGoal);
        break;
      case 'scroll-depth':
        this.trackScrollDepth(goal as ScrollDepthGoal);
        break;
      case 'time-on-page':
        this.trackTimeOnPage(goal as TimeOnPageGoal);
        break;
      case 'element-visibility':
        this.trackElementVisibility(goal as ElementVisibilityGoal);
        break;
      case 'hover':
        this.trackHover(goal as HoverGoal);
        break;
      case 'video-play':
        this.trackVideoPlay(goal as VideoPlayGoal);
        break;
      case 'file-download':
        this.trackFileDownload(goal as FileDownloadGoal);
        break;
    }
  }

  /**
   * Track form completion
   */
  private trackFormCompletion(goal: FormCompletionGoal): void {
    const form = document.querySelector(goal.formSelector) as HTMLFormElement;
    if (!form) return;

    const trackProgress = () => {
      const fields = goal.fieldSelectors 
        ? goal.fieldSelectors.map(sel => form.querySelector(sel)).filter(Boolean)
        : Array.from(form.querySelectorAll('input, select, textarea'));

      let completedFields = 0;
      const totalFields = fields.length;

      fields.forEach(field => {
        const input = field as HTMLInputElement;
        if (input.value.trim() || input.checked) {
          completedFields++;
        }
      });

      const progress = totalFields > 0 ? (completedFields / totalFields) * 100 : 0;
      const threshold = goal.completionThreshold || 100;

      this.updateGoalProgress(goal.eventKey, progress);

      if (progress >= threshold && !this.progress.get(goal.eventKey)?.isCompleted) {
        this.completeGoal(goal.eventKey, {
          formData: this.getFormData(form),
          completedFields,
          totalFields,
          completionRate: progress
        });
      }
    };

    // Track on input changes
    form.addEventListener('input', trackProgress);
    form.addEventListener('change', trackProgress);

    // Track form submission
    if (goal.submitSelector) {
      const submitButton = form.querySelector(goal.submitSelector);
      submitButton?.addEventListener('click', () => {
        this.completeGoal(goal.eventKey, {
          action: 'submit',
          formData: this.getFormData(form)
        });
      });
    }

    form.addEventListener('submit', () => {
      this.completeGoal(goal.eventKey, {
        action: 'submit',
        formData: this.getFormData(form)
      });
    });
  }

  /**
   * Track scroll depth
   */
  private trackScrollDepth(goal: ScrollDepthGoal): void {
    const container = goal.containerSelector 
      ? document.querySelector(goal.containerSelector)
      : window;

    if (!container) return;

    let maxScrollReached = 0;
    const thresholds = [...goal.thresholds].sort((a, b) => a - b);

    const checkScroll = () => {
      let scrollPercent: number;

      if (container === window) {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        scrollPercent = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      } else {
        const element = container as Element;
        const scrollTop = element.scrollTop;
        const scrollHeight = element.scrollHeight - element.clientHeight;
        scrollPercent = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      }

      if (scrollPercent > maxScrollReached) {
        maxScrollReached = scrollPercent;
        this.updateGoalProgress(goal.eventKey, scrollPercent);

        // Check thresholds
        thresholds.forEach(threshold => {
          if (scrollPercent >= threshold) {
            const progress = this.progress.get(goal.eventKey);
            const alreadyTracked = progress?.milestones.some(m => m.threshold === threshold);
            
            if (!alreadyTracked) {
              this.addMilestone(goal.eventKey, threshold, {
                scrollPercent: Math.round(scrollPercent),
                timestamp: Date.now(),
                ...(goal.trackTime && { timeToReach: Date.now() - this.startTime })
              });

              if (threshold === Math.max(...thresholds)) {
                this.completeGoal(goal.eventKey, { maxScrollDepth: scrollPercent });
              }
            }
          }
        });
      }
    };

    const throttledCheck = this.throttle(checkScroll, 100);
    container.addEventListener('scroll', throttledCheck);
  }

  /**
   * Track time on page
   */
  private trackTimeOnPage(goal: TimeOnPageGoal): void {
    const thresholds = [...goal.thresholds].sort((a, b) => a - b);
    let activeTime = 0;
    let lastActiveCheck = Date.now();

    const checkTimeThresholds = () => {
      const currentTime = Date.now();
      const totalTime = (currentTime - this.startTime) / 1000;
      
      if (goal.trackActiveTime && this.isActive) {
        activeTime += (currentTime - lastActiveCheck) / 1000;
        lastActiveCheck = currentTime;
      }

      const timeToCheck = goal.trackActiveTime ? activeTime : totalTime;
      const progress = Math.min((timeToCheck / Math.max(...thresholds)) * 100, 100);
      
      this.updateGoalProgress(goal.eventKey, progress);

      thresholds.forEach(threshold => {
        if (timeToCheck >= threshold) {
          const goalProgress = this.progress.get(goal.eventKey);
          const alreadyTracked = goalProgress?.milestones.some(m => m.threshold === threshold);
          
          if (!alreadyTracked) {
            this.addMilestone(goal.eventKey, threshold, {
              timeOnPage: Math.round(totalTime),
              activeTime: Math.round(activeTime),
              timestamp: Date.now()
            });

            if (threshold === Math.max(...thresholds)) {
              this.completeGoal(goal.eventKey, { 
                totalTime: Math.round(totalTime),
                activeTime: Math.round(activeTime)
              });
            }
          }
        }
      });
    };

    // Check every second
    const interval = setInterval(checkTimeThresholds, 1000);
    this.timers.set(`time-${goal.eventKey}`, interval);
  }

  /**
   * Track element visibility
   */
  private trackElementVisibility(goal: ElementVisibilityGoal): void {
    const element = document.querySelector(goal.selector);
    if (!element) return;

    const threshold = (goal.threshold || 50) / 100;
    const minDuration = goal.duration || 0;
    let visibilityTimer: number | null = null;
    let hasBeenVisible = false;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.intersectionRatio >= threshold) {
            if (!hasBeenVisible || !goal.trackFirstView) {
              if (minDuration > 0) {
                if (visibilityTimer) clearTimeout(visibilityTimer);
                visibilityTimer = window.setTimeout(() => {
                  this.completeGoal(goal.eventKey, {
                    element: goal.selector,
                    visibilityRatio: entry.intersectionRatio,
                    boundingRect: entry.boundingClientRect
                  });
                  hasBeenVisible = true;
                }, minDuration);
              } else {
                this.completeGoal(goal.eventKey, {
                  element: goal.selector,
                  visibilityRatio: entry.intersectionRatio,
                  boundingRect: entry.boundingClientRect
                });
                hasBeenVisible = true;
              }
            }
          } else {
            if (visibilityTimer) {
              clearTimeout(visibilityTimer);
              visibilityTimer = null;
            }
          }
        });
      },
      { threshold }
    );

    observer.observe(element);
    this.observers.set(`visibility-${goal.eventKey}`, observer);
  }

  /**
   * Track hover interactions
   */
  private trackHover(goal: HoverGoal): void {
    const elements = document.querySelectorAll(goal.selector);
    const minDuration = goal.minDuration || 0;
    const trackRepeats = goal.trackRepeats || false;
    const hoveredElements = new Set<Element>();

    elements.forEach(element => {
      let hoverTimer: number | null = null;

      const handleMouseEnter = () => {
        if (!trackRepeats && hoveredElements.has(element)) return;

        if (minDuration > 0) {
          hoverTimer = window.setTimeout(() => {
            this.completeGoal(goal.eventKey, {
              element: goal.selector,
              elementIndex: Array.from(elements).indexOf(element),
              hoverDuration: minDuration
            });
            hoveredElements.add(element);
          }, minDuration);
        } else {
          this.completeGoal(goal.eventKey, {
            element: goal.selector,
            elementIndex: Array.from(elements).indexOf(element)
          });
          hoveredElements.add(element);
        }
      };

      const handleMouseLeave = () => {
        if (hoverTimer) {
          clearTimeout(hoverTimer);
          hoverTimer = null;
        }
      };

      element.addEventListener('mouseenter', handleMouseEnter);
      element.addEventListener('mouseleave', handleMouseLeave);
    });
  }

  /**
   * Track video play events
   */
  private trackVideoPlay(goal: VideoPlayGoal): void {
    const videos = document.querySelectorAll(goal.videoSelector) as NodeListOf<HTMLVideoElement>;

    videos.forEach(video => {
      let hasStarted = false;
      const progressThresholds = goal.progressThresholds || [25, 50, 75];
      const trackedThresholds = new Set<number>();

      const handlePlay = () => {
        if (!hasStarted) {
          this.completeGoal(goal.eventKey, {
            action: 'play',
            video: goal.videoSelector,
            duration: video.duration
          });
          hasStarted = true;
        }
      };

      const handleTimeUpdate = () => {
        if (goal.trackProgress && video.duration > 0) {
          const progress = (video.currentTime / video.duration) * 100;
          
          progressThresholds.forEach(threshold => {
            if (progress >= threshold && !trackedThresholds.has(threshold)) {
              this.addMilestone(goal.eventKey, threshold, {
                progressPercent: threshold,
                currentTime: video.currentTime,
                duration: video.duration
              });
              trackedThresholds.add(threshold);
            }
          });
        }
      };

      const handleEnded = () => {
        if (goal.trackCompletion) {
          this.completeGoal(goal.eventKey, {
            action: 'completed',
            video: goal.videoSelector,
            duration: video.duration
          });
        }
      };

      video.addEventListener('play', handlePlay);
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('ended', handleEnded);
    });
  }

  /**
   * Track file downloads
   */
  private trackFileDownload(goal: FileDownloadGoal): void {
    const handleClick = (event: Event) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a') as HTMLAnchorElement;
      
      if (!link || !link.href) return;

      const url = new URL(link.href, window.location.href);
      const pathname = url.pathname.toLowerCase();
      const isDownload = link.hasAttribute('download') || 
                        link.getAttribute('target') === '_blank' ||
                        (goal.fileTypes && goal.fileTypes.some(ext => pathname.endsWith(ext.toLowerCase())));

      if (goal.trackAllDownloads || isDownload) {
        const fileExtension = pathname.split('.').pop() || '';
        
        this.completeGoal(goal.eventKey, {
          action: 'download',
          url: link.href,
          filename: link.getAttribute('download') || pathname.split('/').pop(),
          fileType: fileExtension,
          linkText: link.textContent?.trim()
        });
      }
    };

    if (goal.linkSelector) {
      const links = document.querySelectorAll(goal.linkSelector);
      links.forEach(link => link.addEventListener('click', handleClick));
    } else {
      document.addEventListener('click', handleClick);
    }
  }

  /**
   * Setup activity tracking for time-based goals
   */
  private setupActivityTracking(): void {
    const updateActivity = () => {
      this.lastActivity = Date.now();
      this.isActive = true;
    };

    const checkActivity = () => {
      const timeSinceActivity = Date.now() - this.lastActivity;
      this.isActive = timeSinceActivity < 30000; // 30 seconds idle threshold
    };

    // Track user activity
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    // Check activity status every 5 seconds
    setInterval(checkActivity, 5000);
  }

  /**
   * Update goal progress
   */
  private updateGoalProgress(goalId: string, progress: number): void {
    const goalProgress = this.progress.get(goalId);
    if (goalProgress) {
      goalProgress.progress = Math.max(goalProgress.progress, progress);
    }
  }

  /**
   * Add milestone to goal progress
   */
  private addMilestone(goalId: string, threshold: number, data: Record<string, any>): void {
    const goalProgress = this.progress.get(goalId);
    if (goalProgress) {
      goalProgress.milestones.push({
        threshold,
        timestamp: Date.now(),
        data
      });
    }

    // Track milestone event
    this.trackingFunction(`${goalId}_milestone`, {
      threshold,
      ...data,
      sessionId: this.sessionId
    });
  }

  /**
   * Complete a goal
   */
  private completeGoal(goalId: string, data: Record<string, any>): void {
    const goalProgress = this.progress.get(goalId);
    if (goalProgress && !goalProgress.isCompleted) {
      goalProgress.isCompleted = true;
      goalProgress.completedAt = Date.now();
      goalProgress.progress = 100;

      // Track completion event
      this.trackingFunction(goalId, {
        ...data,
        sessionId: this.sessionId,
        completedAt: goalProgress.completedAt,
        timeToComplete: goalProgress.completedAt - this.startTime
      });
    }
  }

  /**
   * Cleanup tracking for specific goal
   */
  private cleanupGoalTracking(goalId: string): void {
    const observer = this.observers.get(`visibility-${goalId}`);
    if (observer) {
      observer.disconnect();
      this.observers.delete(`visibility-${goalId}`);
    }

    const timer = this.timers.get(`time-${goalId}`);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(`time-${goalId}`);
    }
  }

  /**
   * Get form data as object
   */
  private getFormData(form: HTMLFormElement): Record<string, any> {
    const formData = new FormData(form);
    const data: Record<string, any> = {};
    
    formData.forEach((value, key) => {
      if (data[key]) {
        if (Array.isArray(data[key])) {
          data[key].push(value);
        } else {
          data[key] = [data[key], value];
        }
      } else {
        data[key] = value;
      }
    });
    
    return data;
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Throttle function calls
   */
  private throttle(func: Function, limit: number): Function {
    let inThrottle: boolean;
    return function(this: any, ...args: any[]) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
}
