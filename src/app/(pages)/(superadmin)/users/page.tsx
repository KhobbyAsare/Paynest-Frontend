"use client"
import { useAuthStore } from "@/(zustand-store)/authStore"
import SuperAdminPage from "./(views)/superAdminView"

export default function Users() {
    const { user } = useAuthStore()
    const userRole = user?.role as 'superadmin' | 'admin' | 'manager' | 'attendant' || 'attendant'

    return (

        <div>
            {userRole === 'superadmin' && <SuperAdminPage />}
            {/* {userRole === 'admin' && <AdminPage />}
            {userRole === 'manager' && <ManagerPage />}
            {userRole === 'attendant' && <AttendantPage />} */}
        </div>
    )
}