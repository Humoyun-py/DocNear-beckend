import { NotificationItem } from '../types';
import { apiClient, apiList } from './apiClient';
export const doctorNotificationService = {
 async getNotifications(): Promise<NotificationItem[]> {
  return (await apiList<any>('/notifications/')).map(n => ({id: String(n.id), title: n.title, message: n.message,
   category: 'clinic_announcement', timestamp: n.created_at, isRead: n.is_read, appointmentId: n.related_object_type === 'appointment' ? String(n.related_object_id) : undefined}));
 },
 async markAsRead(id: string) { await apiClient.post('/notifications/' + id + '/read/'); },
 async markAllAsRead() { await apiClient.post('/notifications/read-all/'); },
 async addNotification(_item: Omit<NotificationItem, 'id' | 'timestamp' | 'isRead'>) { window.dispatchEvent(new Event('docnear:notifications-refresh')); },
 async notifyBookingStatusChange(_code: string, _patient: string, _status: string, _details?: string) { window.dispatchEvent(new Event('docnear:notifications-refresh')); },
};
export const notificationService = doctorNotificationService;
