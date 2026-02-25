"use client"

import { useAuthStore } from "@/(zustand-store)/authStore";

export default function Dashboard() {
    const { user } = useAuthStore();

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="mt-4">
                Welcome back, <span className="font-semibold text-primary">{user?.first_name} {user?.last_name}</span>!
            </p>
        </div>
    )
}