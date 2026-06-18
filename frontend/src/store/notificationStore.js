import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useNotificationStore = create(
  persist(
    (set) => ({
      // Toast notifications (transient, auto-dismiss)
      notifications: [],

      // Activity log (persistent, stored in localStorage)
      activityLog: [],

      addNotification: (message, type = 'success') => {
        const id = Date.now();
        set((state) => ({
          notifications: [...state.notifications, { id, message, type }]
        }));

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
      },

      // Add a rich activity entry (email sent, etc.)
      addActivity: (entry) => {
        const id = Date.now();
        set((state) => ({
          activityLog: [
            { id, ...entry, read: false, timestamp: new Date().toISOString() },
            ...state.activityLog
          ].slice(0, 50) // Keep last 50 entries
        }));
      },

      // Mark a single activity as read
      markRead: (id) => {
        set((state) => ({
          activityLog: state.activityLog.map((a) =>
            a.id === id ? { ...a, read: true } : a
          )
        }));
      },

      // Mark all activities as read
      markAllRead: () => {
        set((state) => ({
          activityLog: state.activityLog.map((a) => ({ ...a, read: true }))
        }));
      },

      clearActivity: () => set({ activityLog: [] }),
    }),
    {
      name: 'caltally-activity-log',
      // Only persist the activityLog, not transient notifications
      partialize: (state) => ({ activityLog: state.activityLog }),
    }
  )
);

export default useNotificationStore;
