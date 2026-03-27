"use client"

import { useEffect } from "react";
import { useAuthStore } from "@/(zustand-store)/authStore";
import { AdminView } from "./views/AdminView";
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
            case 'admin':
                return <AdminView />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
            {renderView()}
        </div>
    );
}
