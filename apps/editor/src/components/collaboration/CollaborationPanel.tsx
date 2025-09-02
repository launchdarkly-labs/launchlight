'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare,
  Users,
  Activity,
  Send,
  MoreHorizontal,
  CheckCircle,
  Circle,
  Clock,
  AtSign,
  Eye,
  Edit3,
  MessageCircle
} from 'lucide-react';
import { 
  CollaborationManager,
  CommentThread,
  ActivityFeed,
  type User,
  type Comment,
  type ActivityEvent,
  type CollaborationState
} from '@webexp/shared';

interface CollaborationPanelProps {
  experimentId: string;
  currentUser: User;
  className?: string;
}

export function CollaborationPanel({ experimentId, currentUser, className = '' }: CollaborationPanelProps) {
  const [collaborationManager] = useState(() => new CollaborationManager(currentUser));
  const [state, setState] = useState<CollaborationState>({
    users: [currentUser],
    comments: [],
    activity: [],
    presence: {}
  });
  const [newComment, setNewComment] = useState('');
  const [selectedTab, setSelectedTab] = useState('comments');

  // Initialize collaboration
  useEffect(() => {
    collaborationManager.initialize(experimentId);
    
    // Setup event listeners
    const updateState = () => setState(collaborationManager.getState());
    
    collaborationManager.on('commentAdded', updateState);
    collaborationManager.on('commentUpdated', updateState);
    collaborationManager.on('commentResolved', updateState);
    collaborationManager.on('activityAdded', updateState);
    collaborationManager.on('userJoined', updateState);
    collaborationManager.on('userLeft', updateState);

    // Update state periodically
    const interval = setInterval(updateState, 1000);

    return () => {
      clearInterval(interval);
      collaborationManager.destroy();
    };
  }, [collaborationManager, experimentId]);

  const handleAddComment = useCallback(() => {
    if (newComment.trim()) {
      collaborationManager.addComment(newComment.trim());
      setNewComment('');
    }
  }, [collaborationManager, newComment]);

  const handleResolveComment = useCallback((commentId: string) => {
    collaborationManager.resolveComment(commentId);
  }, [collaborationManager]);

  const handleReplyToComment = useCallback((commentId: string, content: string) => {
    collaborationManager.replyToComment(commentId, content);
  }, [collaborationManager]);

  const onlineUsers = collaborationManager.getOnlineUsers();
  const unresolvedComments = state.comments.filter(c => c.status === 'open');
  const recentActivity = collaborationManager.getRecentActivity(20);

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b bg-background">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Collaboration</h2>
          <div className="flex items-center gap-1">
            {onlineUsers.slice(0, 3).map((user) => (
              <Avatar key={user.id} className="w-6 h-6">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="text-xs">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
            {onlineUsers.length > 3 && (
              <Badge variant="outline" className="text-xs h-6 px-2">
                +{onlineUsers.length - 3}
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Online</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {onlineUsers.length} user{onlineUsers.length !== 1 ? 's' : ''}
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <MessageSquare className="w-4 h-4 text-green-600" />
              <span>Comments</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {unresolvedComments.length} open
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Activity className="w-4 h-4 text-orange-600" />
              <span>Activity</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {recentActivity.length} recent
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="h-full flex flex-col">
          <TabsList className="mx-4 mt-4">
            <TabsTrigger value="comments" className="flex-1 text-xs">
              <MessageSquare className="w-4 h-4 mr-2" />
              Comments
            </TabsTrigger>
            <TabsTrigger value="users" className="flex-1 text-xs">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex-1 text-xs">
              <Activity className="w-4 h-4 mr-2" />
              Activity
            </TabsTrigger>
          </TabsList>

          {/* Comments Tab */}
          <TabsContent value="comments" className="flex-1 overflow-hidden mt-0 p-4 pt-2">
            <div className="space-y-4 h-full flex flex-col">
              {/* Add Comment */}
              <Card>
                <CardContent className="p-3">
                  <div className="space-y-2">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      rows={3}
                      className="resize-none"
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <AtSign className="w-3 h-3" />
                        <span>Use @username to mention someone</span>
                      </div>
                      <Button 
                        onClick={handleAddComment}
                        disabled={!newComment.trim()}
                        size="sm"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Comment
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Comments List */}
              <div className="flex-1 overflow-hidden">
                {state.comments.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
                    <div className="space-y-3">
                      <MessageSquare className="w-12 h-12 mx-auto" />
                      <div>
                        <h3 className="font-medium">No comments yet</h3>
                        <p className="text-sm">Start a discussion about this experiment</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <ScrollArea className="h-full">
                    <div className="space-y-3">
                      {state.comments.map((comment) => (
                        <CommentItem
                          key={comment.id}
                          comment={comment}
                          users={state.users}
                          currentUser={currentUser}
                          onResolve={() => handleResolveComment(comment.id)}
                          onReply={(content) => handleReplyToComment(comment.id, content)}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="flex-1 overflow-hidden mt-0 p-4 pt-2">
            <div className="space-y-4">
              {state.users.map((user) => {
                const isOnline = onlineUsers.some(u => u.id === user.id);
                
                return (
                  <Card key={user.id}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback>
                                {user.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${
                              isOnline ? 'bg-green-500' : 'bg-gray-400'
                            }`} />
                          </div>
                          <div>
                            <div className="font-medium text-sm">{user.name}</div>
                            <div className="text-xs text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {user.role}
                          </Badge>
                          {isOnline ? (
                            <Badge variant="default" className="text-xs bg-green-100 text-green-700">
                              Online
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Offline
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="flex-1 overflow-hidden mt-0 p-4 pt-2">
            <ScrollArea className="h-full">
              <div className="space-y-3">
                {recentActivity.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Activity className="w-12 h-12 mx-auto mb-3" />
                    <div>
                      <h3 className="font-medium">No recent activity</h3>
                      <p className="text-sm">Activity will appear here as users make changes</p>
                    </div>
                  </div>
                ) : (
                  recentActivity.map((activity) => (
                    <ActivityItem
                      key={activity.id}
                      activity={activity}
                      users={state.users}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface CommentItemProps {
  comment: Comment;
  users: User[];
  currentUser: User;
  onResolve: () => void;
  onReply: (content: string) => void;
}

function CommentItem({ comment, users, currentUser, onResolve, onReply }: CommentItemProps) {
  const [showReply, setShowReply] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  
  const user = users.find(u => u.id === comment.userId);
  const canResolve = currentUser.role === 'owner' || currentUser.role === 'editor' || comment.userId === currentUser.id;

  const handleReply = () => {
    if (replyContent.trim()) {
      onReply(replyContent.trim());
      setReplyContent('');
      setShowReply(false);
    }
  };

  return (
    <Card className={`${comment.status === 'resolved' ? 'opacity-60' : ''}`}>
      <CardContent className="p-3">
        <div className="space-y-3">
          {/* Comment Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="text-xs">
                  {user?.name.charAt(0).toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium text-sm">{user?.name || 'Unknown User'}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(comment.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {comment.status === 'resolved' ? (
                <Badge variant="default" className="text-xs bg-green-100 text-green-700">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Resolved
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs">
                  <Circle className="w-3 h-3 mr-1" />
                  Open
                </Badge>
              )}
            </div>
          </div>

          {/* Comment Content */}
          <div className="text-sm">{comment.content}</div>

          {/* Comment Meta */}
          {(comment.elementSelector || comment.operationIndex !== undefined) && (
            <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
              {comment.elementSelector && (
                <div>Element: <code className="bg-background px-1 rounded">{comment.elementSelector}</code></div>
              )}
              {comment.operationIndex !== undefined && (
                <div>Operation: #{comment.operationIndex + 1}</div>
              )}
            </div>
          )}

          {/* Replies */}
          {comment.replies.length > 0 && (
            <div className="pl-4 border-l-2 border-muted space-y-2">
              {comment.replies.map((reply) => {
                const replyUser = users.find(u => u.id === reply.userId);
                return (
                  <div key={reply.id} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-4 h-4">
                        <AvatarImage src={replyUser?.avatar} />
                        <AvatarFallback className="text-xs">
                          {replyUser?.name.charAt(0).toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium">{replyUser?.name || 'Unknown'}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(reply.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm pl-6">{reply.content}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Actions */}
          {comment.status === 'open' && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowReply(!showReply)}
                className="h-6 px-2 text-xs"
              >
                <MessageCircle className="w-3 h-3 mr-1" />
                Reply
              </Button>
              
              {canResolve && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onResolve}
                  className="h-6 px-2 text-xs"
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Resolve
                </Button>
              )}
            </div>
          )}

          {/* Reply Input */}
          {showReply && (
            <div className="space-y-2 pt-2 border-t">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                rows={2}
                className="resize-none text-sm"
              />
              <div className="flex items-center justify-end gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowReply(false)}
                  className="h-6 px-2 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleReply}
                  disabled={!replyContent.trim()}
                  className="h-6 px-2 text-xs"
                >
                  Reply
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface ActivityItemProps {
  activity: ActivityEvent;
  users: User[];
}

function ActivityItem({ activity, users }: ActivityItemProps) {
  const user = users.find(u => u.id === activity.userId);
  const formattedActivity = ActivityFeed.formatActivity(activity, users);
  const icon = ActivityFeed.getActivityIcon(activity.type);

  return (
    <div className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded">
      <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center text-xs">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm">{formattedActivity}</div>
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <Clock className="w-3 h-3" />
          <span>{new Date(activity.timestamp).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
