import axios from "axios";
import { getAPIHeaders } from "@/lib/getToken";

const BASE_URL = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL;

export interface AppNotification {
    id: number;
    type: string;
    title: string;
    message: string;
    entity_type: string | null;
    entity_id: number | null;
    is_read: boolean;
    created_at: string;
}

export interface NotificationSummary {
    unread_count: number;
    total: number;
    notifications: AppNotification[];
}

export const getNotifications = async (limit = 15, offset = 0): Promise<NotificationSummary> => {
    const res = await axios.get(`${BASE_URL}/notifications/me`, {
        headers: getAPIHeaders(),
        params: { limit, offset },
    });
    return res.data;
};

export const markNotificationRead = async (id: number): Promise<AppNotification> => {
    const res = await axios.put(`${BASE_URL}/notifications/${id}/read`, {}, {
        headers: getAPIHeaders(),
    });
    return res.data;
};

export const markAllNotificationsRead = async (): Promise<void> => {
    await axios.put(`${BASE_URL}/notifications/me/read-all`, {}, {
        headers: getAPIHeaders(),
    });
};
