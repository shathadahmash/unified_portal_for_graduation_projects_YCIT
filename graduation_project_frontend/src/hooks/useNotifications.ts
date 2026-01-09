import { useEffect } from 'react';
import { useNotificationsStore } from '../store/useStore';
import { notificationService } from '../services/notificationService';

export const useNotifications = () => {
  const store = useNotificationsStore();

  useEffect(() => {
    // جلب الإشعارات الأولية
    const fetchNotifications = async () => {
      try {
        const notifications = await notificationService.getNotifications();
        store.setNotifications(notifications);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    fetchNotifications();

    // بدء Polling للإشعارات الجديدة
    const stopPolling = notificationService.startPolling(5000);

    return () => {
      stopPolling();
    };
  }, []);

  return store;
};
