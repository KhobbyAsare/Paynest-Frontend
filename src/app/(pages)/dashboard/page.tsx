"use client"

import { useEffect } from "react";
import { useAuthStore } from "@/(zustand-store)/authStore";
import { AdminView } from "./views/AdminView";
import { SuperAdminView } from "./views/SuperAdminView";
import { useRouter } from "next/navigation";

export default function Dashboard() {
    const { user } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (user?.role === 'attendant') {
            router.replace('/sales');
        } else if (user?.role === 'manager') {
            router.replace('/orders');
        }
    }, [user, router]);

    const renderView = () => {
        switch (user?.role) {
            case 'superadmin':
                return <SuperAdminView />;
            case 'admin':
                return <AdminView />;
            default:
                return null;
        }
    };

    return renderView();
}
