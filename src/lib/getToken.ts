import { useAuthStore } from "@/(zustand-store)/authStore"

export function getToken() {
    const { accessToken } = useAuthStore.getState()
    return accessToken
}

export function getAPIHeaders() {
    const token = getToken()
    console.log(token)
    return {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
    }
}