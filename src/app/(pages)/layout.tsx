import AppShell from "@/components/(shared-components)/AppShell";

export default function PagesLayout({ children }: { children: React.ReactNode }) {
    return <AppShell>{children}</AppShell>;
}
