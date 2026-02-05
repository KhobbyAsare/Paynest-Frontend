import Sidebar from "@/components/(shared-components)/sidebar-navigation";


export default function PagesLayout({ children }: { children: React.ReactNode }) {
    return (
        <Sidebar>
            {children}
        </Sidebar>
    )
}