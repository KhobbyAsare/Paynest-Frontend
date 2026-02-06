"use client"
import { useAuthStore } from "@/(zustand-store)/authStore";
import SuperAdminView from "./(views)/superAdminView";

export default function Organization() {
    const user = useAuthStore((state) => state.user);
    return (
        <div>
            {user?.role === 'superadmin' && <SuperAdminView />}
        </div>
    )
}