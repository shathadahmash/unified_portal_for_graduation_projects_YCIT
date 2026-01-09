import api from './api';
import { useNotificationsStore } from '../store/useStore';

export const notificationService = {
  // 1. جلب الإشعارات (معدلة)
    
  async getNotifications(limit: number = 50) {
    const token = localStorage.getItem("access_token");
    if (!token) return []; 

    try {
      const response = await api.get('/notifications/', { 
        params: { limit },
        headers: { 'Authorization': `Bearer ${token}` }
      });
      // DRF قد يرجع البيانات داخل مصفوفة مباشرة أو داخل كائن pagination
      return Array.isArray(response.data) ? response.data : (response.data.results || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      return [];
    }
  },

  // 2. جلب عدد الإشعارات غير المقروءة (أضفنا السلاش والتوكن)
  async getUnreadCount() {
    const token = localStorage.getItem("access_token");
    try {
      const response = await api.get('/notifications/unread-count/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data.count;
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      return 0;
    }
  },

  // 3. تحديد إشعار كمقروء (أضفنا السلاش والتوكن)
  async markAsRead(notificationId: number) {
    const token = localStorage.getItem("access_token");
    try {
      await api.post(`/notifications/${notificationId}/mark-read/`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  },

  // 4. تحديد جميع الإشعارات كمقروءة (أضفنا السلاش والتوكن)
  async markAllAsRead() {
    const token = localStorage.getItem("access_token");
    try {
      await api.post('/notifications/mark-all-read/', {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  },

  // 5. حذف إشعار
  async deleteNotification(notificationId: number) {
    const token = localStorage.getItem("access_token");
    try {
      await api.delete(`/notifications/${notificationId}/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  },

  // 6. بدء Polling
  startPolling(interval: number = 5000) {
    const pollInterval = setInterval(async () => {
      const token = localStorage.getItem("access_token");
      if (!token) return;

      try {
        const notifications = await this.getNotifications();
        if (Array.isArray(notifications)) {
           useNotificationsStore.getState().setNotifications(notifications);
        }
      } catch (error) {}
    }, interval);

    return () => clearInterval(pollInterval);
  }
};