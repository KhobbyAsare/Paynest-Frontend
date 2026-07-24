"use client"
import { useAuthStore } from "@/(zustand-store)/authStore"
import SuperAdminPage from "./(views)/superAdminView"
import UsersAdministratorView from "./(views)/AdministratorView"

export default function Users() {
    const { user } = useAuthStore()
    const userRole = user?.role as 'superadmin' | 'admin' | 'manager' | 'attendant' || 'attendant'

    return (

        <div>
            {userRole === 'superadmin' && <SuperAdminPage />}
            {userRole === 'admin' && <UsersAdministratorView />}

        </div>
    )
}