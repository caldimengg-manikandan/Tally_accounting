import { create } from 'zustand';

const useNotificationStore = create((set) => ({
  notifications: [],
  addNotification: (message, type = 'success') => {
    const id = Date.now();
    set((state) => ({
      notifications: [...state.notifications, { id, message, type }]
    }));

    // Make notifications stay longer (6 seconds for success, 8.5 seconds for warnings/errors/info)
    const duration = type === 'success' ? 6000 : 8500;
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id)
      }));
    }, duration);
  },
  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id)
    }));
  }
}));

export default useNotificationStore;
