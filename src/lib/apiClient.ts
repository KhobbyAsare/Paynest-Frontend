import axios from "axios";
import { useAuthStore } from "@/(zustand-store)/authStore";
import { toast } from "sonner";

export const API_BASE = `${process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL}/api/v1`;

const apiClient = axios.create({
    baseURL: API_BASE,
});

// Inject JWT token on every request
apiClient.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Guard to prevent multiple simultaneous 401 redirects
let isRedirecting = false;

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (
            axios.isAxiosError(error) &&
            error.response?.status === 401 &&
            !isRedirecting
        ) {
            isRedirecting = true;
            useAuthStore.getState().clearAuth();
            toast.error("Your session has expired. Please sign in again.");
            if (typeof window !== "undefined") {
                window.location.replace("/login");
            }
            // Never-resolving promise stops page-level catch handlers from firing
            // while the navigation is in progress.
            return new Promise(() => {});
        }
        return Promise.reject(error);
    }
);

export default apiClient;
