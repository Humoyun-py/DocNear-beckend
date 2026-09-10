import { create } from 'zustand';
import { NotificationItem } from '../types';
import { notificationService } from '../services/notificationService';

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const data = await notificationService.getNotifications();
      set({
        notifications: data,
        unreadCount: data.filter((n) => !n.isRead).length,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  markAsRead: async (id) => {
    await notificationService.markAsRead(id);
    const updated = get().notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    set({
      notifications: updated,
      unreadCount: updated.filter((n) => !n.isRead).length,
    });
  },

  markAllAsRead: async () => {
    await notificationService.markAllAsRead();
    const updated = get().notifications.map((n) => ({ ...n, isRead: true }));
    set({
      notifications: updated,
      unreadCount: 0,
    });
  },
}));
