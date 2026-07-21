"use client";

import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import { useAuthStore } from "@/(zustand-store)/authStore";
import { usePayrollOrgStore } from "@/(zustand-store)/payrollOrgStore";
import { getAllOrganizations } from "@/(api-handlers)/organizationHandler";
import { OrganizationResponse } from "@/interfaces/organization";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export default function PayrollOrgPicker() {
    const { user } = useAuthStore();
    const { selectedOrgId, setSelectedOrgId } = usePayrollOrgStore();
    const [orgs, setOrgs] = useState<OrganizationResponse[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.role !== 'superadmin') return;
        getAllOrganizations()
            .then(setOrgs)
            .catch(() => setOrgs([]))
            .finally(() => setLoading(false));
    }, [user?.role]);

    if (user?.role !== 'superadmin') return null;

    if (loading) return <Skeleton className="h-9 w-64" />;

    return (
        <Select
            value={selectedOrgId ? String(selectedOrgId) : undefined}
            onValueChange={(v) => setSelectedOrgId(Number(v))}
        >
            <SelectTrigger className="w-64">
                <Building2 className="text-muted-foreground size-4" />
                <SelectValue placeholder="Select an organization…" />
            </SelectTrigger>
            <SelectContent>
                {orgs.map(org => (
                    <SelectItem key={org.id} value={String(org.id)}>{org.name}</SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
