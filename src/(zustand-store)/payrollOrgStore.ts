import { create } from "zustand";

interface PayrollOrgState {
    selectedOrgId: number | null;
    setSelectedOrgId: (id: number | null) => void;
}

// Session-only — lets a superadmin pick which org's payroll to view.
// Not read for admins; their org is inferred server-side from the token.
export const usePayrollOrgStore = create<PayrollOrgState>((set) => ({
    selectedOrgId: null,
    setSelectedOrgId: (id) => set({ selectedOrgId: id }),
}));
