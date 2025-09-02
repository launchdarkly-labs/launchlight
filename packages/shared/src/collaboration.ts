/**
 * Collaboration features for multi-user experiment editing
 */

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'editor' | 'viewer';
  lastActive: number;
  isOnline: boolean;
}

export interface Comment {
  id: string;
  userId: string;
  content: string;
  timestamp: number;
  elementSelector?: string;
  operationIndex?: number;
  position?: { x: number; y: number };
  status: 'open' | 'resolved';
  replies: CommentReply[];
  mentions: string[]; // User IDs
  attachments?: CommentAttachment[];
}

export interface CommentReply {
  id: string;
  userId: string;
  content: string;
  timestamp: number;
}

export interface CommentAttachment {
  id: string;
  name: string;
  type: 'image' | 'file';
  url: string;
  size: number;
}

export interface ActivityEvent {
  id: string;
  userId: string;
  type: 'operation_added' | 'operation_removed' | 'operation_modified' | 'comment_added' | 'comment_resolved' | 'template_applied' | 'payload_published';
  timestamp: number;
  data: Record<string, any>;
  description: string;
}

export interface CollaborationState {
  users: User[];
  comments: Comment[];
  activity: ActivityEvent[];
  presence: Record<string, UserPresence>; // userId -> presence
}

export interface UserPresence {
  userId: string;
  cursor?: { x: number; y: number };
  selectedElement?: string; // CSS selector
  viewport?: { x: number; y: number; zoom: number };
  lastSeen: number;
}

export interface CollaborationEvents {
  userJoined: { user: User };
  userLeft: { userId: string };
  userPresenceUpdate: { presence: UserPresence };
  commentAdded: { comment: Comment };
  commentUpdated: { comment: Comment };
  commentResolved: { commentId: string; userId: string };
  activityAdded: { activity: ActivityEvent };
  conflictDetected: { conflictType: string; data: any };
}

/**
 * Collaboration manager for real-time multi-user editing
 */
export class CollaborationManager {
  private state: CollaborationState;
  private currentUser: User;
  private eventListeners: { [K in keyof CollaborationEvents]?: ((event: CollaborationEvents[K]) => void)[] } = {};
  private presenceUpdateInterval: number | null = null;
  private activityBuffer: ActivityEvent[] = [];

  constructor(currentUser: User) {
    this.currentUser = currentUser;
    this.state = {
      users: [currentUser],
      comments: [],
      activity: [],
      presence: {}
    };
    
    this.startPresenceTracking();
  }

  /**
   * Initialize collaboration for experiment
   */
  async initialize(experimentId: string): Promise<void> {
    // In real implementation, this would connect to WebSocket/Socket.io
    console.log(`Initializing collaboration for experiment: ${experimentId}`);
    
    // Mock loading existing state
    await this.loadCollaborationState(experimentId);
    
    // Start real-time updates
    this.startRealTimeUpdates();
  }

  /**
   * Add a comment to the experiment
   */
  addComment(content: string, options?: {
    elementSelector?: string;
    operationIndex?: number;
    position?: { x: number; y: number };
    mentions?: string[];
  }): Comment {
    const comment: Comment = {
      id: this.generateId(),
      userId: this.currentUser.id,
      content,
      timestamp: Date.now(),
      elementSelector: options?.elementSelector,
      operationIndex: options?.operationIndex,
      position: options?.position,
      status: 'open',
      replies: [],
      mentions: options?.mentions || [],
      attachments: []
    };

    this.state.comments.push(comment);
    this.emit('commentAdded', { comment });
    
    // Add activity event
    this.addActivity('comment_added', {
      commentId: comment.id,
      content: content.substring(0, 100)
    }, `added a comment: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`);

    return comment;
  }

  /**
   * Reply to a comment
   */
  replyToComment(commentId: string, content: string): CommentReply {
    const comment = this.state.comments.find(c => c.id === commentId);
    if (!comment) throw new Error('Comment not found');

    const reply: CommentReply = {
      id: this.generateId(),
      userId: this.currentUser.id,
      content,
      timestamp: Date.now()
    };

    comment.replies.push(reply);
    this.emit('commentUpdated', { comment });

    return reply;
  }

  /**
   * Resolve a comment
   */
  resolveComment(commentId: string): void {
    const comment = this.state.comments.find(c => c.id === commentId);
    if (!comment) throw new Error('Comment not found');

    comment.status = 'resolved';
    this.emit('commentResolved', { commentId, userId: this.currentUser.id });
    
    this.addActivity('comment_resolved', {
      commentId
    }, `resolved a comment`);
  }

  /**
   * Update user presence
   */
  updatePresence(presence: Partial<UserPresence>): void {
    const currentPresence = this.state.presence[this.currentUser.id] || {
      userId: this.currentUser.id,
      lastSeen: Date.now()
    };

    const updatedPresence: UserPresence = {
      ...currentPresence,
      ...presence,
      lastSeen: Date.now()
    };

    this.state.presence[this.currentUser.id] = updatedPresence;
    this.emit('userPresenceUpdate', { presence: updatedPresence });
  }

  /**
   * Add activity event
   */
  addActivity(type: ActivityEvent['type'], data: Record<string, any>, description: string): void {
    const activity: ActivityEvent = {
      id: this.generateId(),
      userId: this.currentUser.id,
      type,
      timestamp: Date.now(),
      data,
      description
    };

    this.activityBuffer.push(activity);
    
    // Batch activity updates
    if (this.activityBuffer.length >= 5) {
      this.flushActivityBuffer();
    }
  }

  /**
   * Get comments for specific element or operation
   */
  getCommentsFor(elementSelector?: string, operationIndex?: number): Comment[] {
    return this.state.comments.filter(comment => {
      if (elementSelector && comment.elementSelector === elementSelector) return true;
      if (operationIndex !== undefined && comment.operationIndex === operationIndex) return true;
      return false;
    });
  }

  /**
   * Get online users
   */
  getOnlineUsers(): User[] {
    const now = Date.now();
    return this.state.users.filter(user => {
      const presence = this.state.presence[user.id];
      return presence && (now - presence.lastSeen) < 30000; // 30 seconds
    });
  }

  /**
   * Get recent activity
   */
  getRecentActivity(limit: number = 50): ActivityEvent[] {
    return this.state.activity
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get collaboration state
   */
  getState(): CollaborationState {
    return { ...this.state };
  }

  /**
   * Detect conflicts in operations
   */
  detectConflicts(newOperations: any[]): { hasConflicts: boolean; conflicts: any[] } {
    // Simplified conflict detection
    // In real implementation, this would use operational transformation
    const conflicts: any[] = [];
    
    // Check for conflicting selectors
    const selectors = new Set();
    for (const op of newOperations) {
      if (op.selector && selectors.has(op.selector)) {
        conflicts.push({
          type: 'selector_conflict',
          selector: op.selector,
          operations: [op]
        });
      }
      selectors.add(op.selector);
    }

    return {
      hasConflicts: conflicts.length > 0,
      conflicts
    };
  }

  /**
   * Add event listener
   */
  on<K extends keyof CollaborationEvents>(event: K, listener: (data: CollaborationEvents[K]) => void): void {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event]!.push(listener);
  }

  /**
   * Remove event listener
   */
  off<K extends keyof CollaborationEvents>(event: K, listener: (data: CollaborationEvents[K]) => void): void {
    const listeners = this.eventListeners[event];
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Cleanup collaboration
   */
  destroy(): void {
    if (this.presenceUpdateInterval) {
      clearInterval(this.presenceUpdateInterval);
    }
    
    this.flushActivityBuffer();
    this.eventListeners = {};
  }

  /**
   * Emit event to listeners
   */
  private emit<K extends keyof CollaborationEvents>(event: K, data: CollaborationEvents[K]): void {
    const listeners = this.eventListeners[event];
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error('Error in collaboration event listener:', error);
        }
      });
    }
  }

  /**
   * Start presence tracking
   */
  private startPresenceTracking(): void {
    // Update presence every 10 seconds
    this.presenceUpdateInterval = window.setInterval(() => {
      this.updatePresence({});
    }, 10000);

    // Track mouse movement
    document.addEventListener('mousemove', (e) => {
      this.updatePresence({
        cursor: { x: e.clientX, y: e.clientY }
      });
    });
  }

  /**
   * Start real-time updates (mock)
   */
  private startRealTimeUpdates(): void {
    // In real implementation, this would connect to WebSocket
    console.log('Starting real-time collaboration updates');
  }

  /**
   * Load collaboration state (mock)
   */
  private async loadCollaborationState(experimentId: string): Promise<void> {
    // Mock loading delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock data
    this.state.comments = [];
    this.state.activity = [
      {
        id: this.generateId(),
        userId: this.currentUser.id,
        type: 'operation_added',
        timestamp: Date.now() - 3600000,
        data: { operation: 'textReplace' },
        description: 'added a text replacement operation'
      }
    ];
  }

  /**
   * Flush activity buffer
   */
  private flushActivityBuffer(): void {
    if (this.activityBuffer.length === 0) return;
    
    this.state.activity.push(...this.activityBuffer);
    this.activityBuffer.forEach(activity => {
      this.emit('activityAdded', { activity });
    });
    
    this.activityBuffer = [];
    
    // Keep only recent activity (last 1000 events)
    if (this.state.activity.length > 1000) {
      this.state.activity = this.state.activity.slice(-1000);
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `collab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Comment thread utilities
 */
export class CommentThread {
  static groupByElement(comments: Comment[]): Record<string, Comment[]> {
    const grouped: Record<string, Comment[]> = {};
    
    comments.forEach(comment => {
      const key = comment.elementSelector || 'general';
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(comment);
    });
    
    return grouped;
  }

  static getUnresolvedCount(comments: Comment[]): number {
    return comments.filter(c => c.status === 'open').length;
  }

  static getMentionedUsers(comments: Comment[]): string[] {
    const mentioned = new Set<string>();
    
    comments.forEach(comment => {
      comment.mentions.forEach(userId => mentioned.add(userId));
    });
    
    return Array.from(mentioned);
  }
}

/**
 * Activity feed utilities
 */
export class ActivityFeed {
  static formatActivity(activity: ActivityEvent, users: User[]): string {
    const user = users.find(u => u.id === activity.userId);
    const userName = user?.name || 'Unknown User';
    
    return `${userName} ${activity.description}`;
  }

  static groupByDate(activities: ActivityEvent[]): Record<string, ActivityEvent[]> {
    const grouped: Record<string, ActivityEvent[]> = {};
    
    activities.forEach(activity => {
      const date = new Date(activity.timestamp).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(activity);
    });
    
    return grouped;
  }

  static getActivityIcon(type: ActivityEvent['type']): string {
    const icons = {
      operation_added: '➕',
      operation_removed: '➖',
      operation_modified: '✏️',
      comment_added: '💬',
      comment_resolved: '✅',
      template_applied: '📋',
      payload_published: '🚀'
    };
    
    return icons[type] || '📝';
  }
}
