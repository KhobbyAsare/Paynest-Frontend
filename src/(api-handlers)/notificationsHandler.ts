import apiClient from "@/lib/apiClient";

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
    const res = await apiClient.get(`/notifications/me`, {
        params: { limit, offset },
    });
    return res.data;
};

export const markNotificationRead = async (id: number): Promise<AppNotification> => {
    const res = await apiClient.put(`/notifications/${id}/read`, {});
    return res.data;
};

export const markAllNotificationsRead = async (): Promise<void> => {
    await apiClient.put(`/notifications/me/read-all`, {});
};

/**
 * Opens an SSE connection to /notifications/me/stream.
 * Auth is via ?token=<jwt> because EventSource cannot send custom headers.
 * Returns the EventSource instance so the caller can close it on cleanup.
 */
export const createNotificationStream = (
    token: string,
    onNotifications: (notifs: AppNotification[]) => void,
    onError?: () => void,
): EventSource => {
    const url = `${BASE_URL}/notifications/me/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    es.onmessage = (e) => {
        try {
            const data = JSON.parse(e.data) as AppNotification[];
            if (Array.isArray(data) && data.length > 0) {
                onNotifications(data);
            }
        } catch { /* malformed frame — ignore */ }
    };
    es.onerror = () => {
        onError?.();
        es.close();
    };
    return es;
};
