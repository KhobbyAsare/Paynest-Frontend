"use client"

import { useEffect, useState } from 'react';
import { Search, Pencil, RefreshCcw, Users } from 'lucide-react';
import { getAllUsers } from '@/(api-handlers)/userHandler';
import { UserResponse } from '@/interfaces/loginInterface';
import PageHeader from '@/components/(shared-components)/PageHeader';
import Pagination from '@/components/(shared-components)/Pagination';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const ITEMS_PER_PAGE = 10;

export default function SuperAdminPage() {
    const [users, setUsers] = useState<UserResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            setUsers(await getAllUsers());
        } catch {
            toast.error('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);
    useEffect(() => { setCurrentPage(1); }, [searchText]);

    const filtered = users.filter(u =>
        `${u.first_name} ${u.last_name} ${u.email} ${u.username}`
            .toLowerCase()
            .includes(searchText.toLowerCase())
    );

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const currentUsers = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="User Management"
                description="Manage and monitor all platform users in one place."
                actions={
                    <Button variant="outline" size="icon" className="size-9" onClick={fetchUsers} disabled={loading}>
                        <RefreshCcw className={cn("size-4", loading && "animate-spin")} />
                    </Button>
                }
            />

            <div className="relative max-w-sm">
                <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <Input
                    placeholder="Search by name, email or username…"
                    className="h-9 pl-9"
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                />
            </div>

            <Card className="gap-0 overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-6">Full Name</TableHead>
                                <TableHead>Username</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Verified</TableHead>
                                <TableHead>Organization</TableHead>
                                <TableHead className="pr-6 w-[80px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: 8 }).map((_, j) => (
                                            <TableCell key={j}><Skeleton className="h-5 w-full rounded" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : currentUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="py-20 text-center">
                                        <div className="bg-muted mx-auto mb-4 flex size-14 items-center justify-center rounded-full">
                                            <Users className="text-muted-foreground size-7" />
                                        </div>
                                        <p className="text-foreground font-semibold">No users found</p>
                                        <p className="text-muted-foreground mt-1 text-sm">
                                            {searchText ? 'Try a different search term.' : 'No users exist in the system.'}
                                        </p>
                                    </TableCell>
                                </TableRow>
                            ) : currentUsers.map(u => (
                                <TableRow key={u.email}>
                                    <TableCell className="pl-6 font-medium">{u.first_name} {u.last_name}</TableCell>
                                    <TableCell className="text-muted-foreground">{u.username}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize text-xs rounded-full">
                                            {u.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">{u.email}</TableCell>
                                    <TableCell className="text-muted-foreground text-sm">{u.phone_number || '—'}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "text-xs rounded-full",
                                                u.email_verified
                                                    ? "border-success/30 bg-success/10 text-success"
                                                    : "border-warning/30 bg-warning/10 text-warning-foreground"
                                            )}
                                        >
                                            {u.email_verified ? 'Verified' : 'Pending'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {u.employee_profile?.organization_id ?? '—'}
                                    </TableCell>
                                    <TableCell className="pr-6 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="icon" className="size-8" asChild>
                                                <Link href={`/users/${u.id}`}>View</Link>
                                            </Button>
                                            {u.employee_profile && (
                                                <Button variant="ghost" size="icon" className="size-8" asChild>
                                                    <Link href={`/users/edit-employee-profile/${u.id}`}><Pencil className="size-4" /></Link>
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {!loading && filtered.length > ITEMS_PER_PAGE && (
                    <div className="border-border border-t px-6 py-3">
                        <Pagination
                            page={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            total={filtered.length}
                            isLoading={loading}
                        />
                    </div>
                )}
            </Card>
        </div>
    );
}
