import React, { createContext, useContext, useEffect, useState } from "react";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface NotificationContextType {
  permission: boolean;
  requestPermission: () => Promise<void>;
  scheduleReminder: (title: string, body: string, secondsFromNow: number) => Promise<string>;
  cancelAll: () => Promise<void>;
  scheduled: Notifications.NotificationRequest[];
}

const NotificationContext = createContext<NotificationContextType>({
  permission: false,
  requestPermission: async () => {},
  scheduleReminder: async () => "",
  cancelAll: async () => {},
  scheduled: [],
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [permission, setPermission] = useState(false);
  const [scheduled, setScheduled] = useState<Notifications.NotificationRequest[]>([]);

  useEffect(() => {
    if (Platform.OS === "web") return;
    checkPermission();
    loadScheduled();
  }, []);

  const checkPermission = async () => {
    const result = (await Notifications.getPermissionsAsync()) as any;
    setPermission(result.granted === true);
  };

  const requestPermission = async () => {
    if (Platform.OS === "web") return;
    const result = (await Notifications.requestPermissionsAsync()) as any;
    setPermission(result.granted === true);
  };

  const loadScheduled = async () => {
    const list = await Notifications.getAllScheduledNotificationsAsync();
    setScheduled(list);
  };

  const scheduleReminder = async (title: string, body: string, secondsFromNow: number) => {
    const id = await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: "default" },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsFromNow,
        repeats: false,
      },
    });
    await loadScheduled();
    return id;
  };

  const cancelAll = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    setScheduled([]);
  };

  return (
    <NotificationContext.Provider value={{ permission, requestPermission, scheduleReminder, cancelAll, scheduled }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
