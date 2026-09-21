import { Notification } from '../types';
import { apiList, apiRequest } from './apiClient';
export const notificationService = {
 async getNotifications(): Promise<Notification[]> {
  return (await apiList<any>('notifications/')).map(n => ({id: String(n.id), type: 'system', title: n.title, message: n.message,
   timestamp: n.created_at, isRead: n.is_read, appointmentId: n.related_object_type === 'appointment' ? String(n.related_object_id) : undefined}));
 },
 async markAsRead(id: string) { await apiRequest('notifications/' + id + '/read/', {method: 'POST'}); return this.getNotifications(); },
 async markAllAsRead() { await apiRequest('notifications/read-all/', {method: 'POST'}); return this.getNotifications(); },
 addNotification(_item: unknown) { window.dispatchEvent(new Event('docnear:notifications-refresh')); },
};
