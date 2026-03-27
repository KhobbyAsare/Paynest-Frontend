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

    useEffect(() => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap';
        document.head.appendChild(link);

        const style = document.createElement('style');
        style.textContent = `
            * { box-sizing: border-box; }
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(5px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .view-animate { animation: fadeIn 0.3s ease; }
        `;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(link);
            document.head.removeChild(style);
        };
    }, []);

    const renderView = () => {
        switch (user?.role) {
            case 'superadmin':
            case 'admin':
                return <AdminView />;
            case 'manager':
            case 'attendant':
                return null;
            default:
                return <div>Loading view...</div>;
        }
    };

    return (
        <div style={{ backgroundColor: '#F4F5F5', minHeight: 'calc(100vh - 64px)' }}>
            <div className="p-8 pb-4">
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <p className="mt-2 text-gray-600">
                    Welcome back, <span className="font-semibold text-primary">{user?.first_name} {user?.last_name}</span>!
                    <span className="ml-3 px-2.5 py-1 text-xs font-medium uppercase tracking-wider bg-gray-200 text-gray-800 rounded">{user?.role}</span>
                </p>
            </div>
            
            <div className="p-8 pt-4 view-animate" style={{
                color: '#000000', 
                fontFamily: "'Inter', -apple-system, sans-serif", 
                WebkitFontSmoothing: 'antialiased', 
                lineHeight: '1.5'
            }}>
                <div className="bg-white p-8 rounded shadow-sm border border-gray-100">
                    {renderView()}
                </div>
            </div>
        </div>
    )
}