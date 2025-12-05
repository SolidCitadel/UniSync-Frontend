import { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { notificationsApi, friendsApi } from '@/api';
import type { Notification } from '@/types';

// Global flag to prevent duplicate checks across StrictMode double renders
let globalIsChecking = false;
const globalProcessedIds = new Set<string>();

export default function NotificationPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    try {
      // Only load notifications if user is logged in
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      const data = await notificationsApi.listNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkForNewFriendRequests = useCallback(async () => {
    // Prevent concurrent executions using global flag
    if (globalIsChecking) {
      return;
    }

    try {
      globalIsChecking = true;

      // Only check if user is logged in (has auth token)
      const token = localStorage.getItem('auth_token');
      if (!token) {
        return;
      }

      const pendingRequests = await friendsApi.getPendingRequests();

      if (pendingRequests.length === 0) {
        return;
      }

      // Get current notifications to check for existing friend request notifications
      const currentNotifications = await notificationsApi.listNotifications();
      const existingRequestIds = new Set(
        currentNotifications
          .filter(n => n.type === 'friend_request' && n.relatedId)
          .map(n => n.relatedId)
      );

      let hasNewRequests = false;

      // Check for new requests that we haven't processed yet
      for (const request of pendingRequests) {
        // Skip if already in global processedIds or if notification already exists
        if (globalProcessedIds.has(request.id) || existingRequestIds.has(request.id)) {
          continue;
        }

        // Create notification for this friend request
        await notificationsApi.createNotification(
          'friend_request',
          '친구 요청',
          `${request.fromUserName}님이 친구 요청을 보냈습니다.`,
          request.id,
          '/friends'
        );

        globalProcessedIds.add(request.id);
        hasNewRequests = true;
      }

      // Reload notifications if there were new requests
      if (hasNewRequests) {
        const data = await notificationsApi.listNotifications();
        setNotifications(data);
      }
    } catch (error) {
      console.error('[NotificationPanel] Failed to check for friend requests:', error);
    } finally {
      globalIsChecking = false;
    }
  }, []); // Remove loadNotifications from dependencies

  useEffect(() => {
    // Clear global processed IDs on mount to prevent duplicates across sessions
    globalProcessedIds.clear();

    loadNotifications();
    checkForNewFriendRequests(); // Initial check (only runs if logged in)

    // Poll for new friend requests every 30 seconds (only runs if logged in)
    const interval = setInterval(() => {
      checkForNewFriendRequests();
    }, 30000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to run only once on mount

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'friend_request':
        return 'bg-blue-100 text-blue-600';
      case 'group_schedule_added':
        return 'bg-green-100 text-green-600';
      case 'group_invitation':
        return 'bg-purple-100 text-purple-600';
      case 'schedule_reminder':
        return 'bg-orange-100 text-orange-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationsApi.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    return `${days}일 전`;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-lg hover:bg-gray-100"
        >
          <Bell className="w-5 h-5 text-gray-700" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" sideOffset={8}>
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-gray-900 font-semibold">알림</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs"
            >
              모두 읽음
            </Button>
          )}
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <p>로딩 중...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>알림이 없습니다</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notification.read ? 'bg-blue-50/50' : ''
                  }`}
                  onClick={() => {
                    if (!notification.read) {
                      handleMarkAsRead(notification.id);
                    }
                  }}
                >
                  <div className="flex gap-3">
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-full ${getTypeColor(
                        notification.type
                      )} flex items-center justify-center`}
                    >
                      <Bell className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 flex-shrink-0 mt-1"></div>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mb-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
