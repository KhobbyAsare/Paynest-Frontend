"use client"

import { useAuthStore } from "@/(zustand-store)/authStore";
import { useEffect, useState } from "react";

export default function Dashboard() {
    const { user } = useAuthStore();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return null;

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="mt-4">
                Welcome back, <span className="font-semibold text-primary">{user?.first_name} {user?.last_name}</span>!
            </p>
        </div>
    )
}