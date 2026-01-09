/* eslint-disable react-refresh/only-export-components */

import React, { createContext, useContext, useEffect, useState } from "react";
import { getCustomerNotification } from "../CustomerServices";

import { client, Config } from "../appwrite";
import { getCurrentUser } from "../authServices";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    const init = async () => {
      try {
        const notifications = await getCustomerNotification();
        const unreadCount = notifications.filter((n) => !n.read).length;
        setNotificationCount(unreadCount);
      } catch (err) {
        console.error("Error initializing notifications:", err);
      }
    };

    init();

    const unsubscribe = client.subscribe(
      `databases.${Config.databaseId}.collections.${Config.NOTIFICATIONS_COLLECTION_ID}.documents`,
      async (response) => {
        const { payload, events } = response;
        const user = await getCurrentUser();

        if (
          events.includes("databases.*.documents.*.create") &&
          payload.userId === user.$id &&
          payload.type === "userNotification" &&
          payload.read === false
        ) {
          setNotificationCount((prev) => prev + 1);
        }
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notificationCount, setNotificationCount }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
