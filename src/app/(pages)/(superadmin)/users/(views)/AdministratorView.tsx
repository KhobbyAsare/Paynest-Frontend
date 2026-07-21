"use client"

import { useEffect, useState } from 'react';
import {
    Search, Eye, Pencil, RefreshCcw, Users,
    UserPlus, Copy, Check,
} from 'lucide-react';
import { getOrganizationUsers } from '@/(api-handlers)/userHandler';
import { generateInvitationCode } from '@/(api-handlers)/organizationHandler';
import { UserResponse } from '@/interfaces/loginInterface';
import { GeneratedCodeResponse } from '@/interfaces/organization';
import PageHeader from '@/components/(shared-components)/PageHeader';
import Pagination from '@/components/(shared-components)/Pagination';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuthStore } from '@/(zustand-store)/authStore';
import { handleErrorMessage } from '@/utils/handleErrorMessage';
import Link from 'next/link';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const ITEMS_PER_PAGE = 10;

const ROLE_BADGE: Record<string, string> = {
    superadmin: 'border-primary/30 bg-primary/10 text-primary',
    admin:      'border-info/30 bg-info/10 text-info',
    manager:    'border-success/30 bg-success/10 text-success',
    attendant:  'border-border bg-muted text-muted-foreground',
};

export default function UsersAdministratorView() {
    const { user } = useAuthStore();
    const [users, setUsers] = useState<UserResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [invitationCode, setInvitationCode] = useState<GeneratedCodeResponse | null>(null);
    const [generatingCode, setGeneratingCode] = useState(false);
    const [copied, setCopied] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            setUsers(await getOrganizationUsers());
        } catch (error) {
            handleErrorMessage(error, 'Failed to fetch users');
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

    const handleGenerateCode = async () => {
        if (!user?.organization?.id) {
            toast.error('Organization ID not found');
            return;
        }
        setGeneratingCode(true);
        try {
            const response = await generateInvitationCode(user.organization.id);
            setInvitationCode(response);
            setIsInviteOpen(true);
        } catch (error) {
            handleErrorMessage(error, 'Failed to generate invitation code');
        } finally {
            setGeneratingCode(false);
        }
    };

    const copyToClipboard = () => {
        if (invitationCode?.code) {
            navigator.clipboard.writeText(invitationCode.code);
            setCopied(true);
            toast.success('Code copied to clipboard!');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <TooltipProvider>
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Users"
                description="Manage your organization users and their profiles."
                actions={
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="size-9" onClick={fetchUsers} disabled={loading}>
                            <RefreshCcw className={cn("size-4", loading && "animate-spin")} />
                        </Button>
                        <Button onClick={handleGenerateCode} disabled={generatingCode}>
                            <UserPlus className="mr-2 size-4" />
                            {generatingCode ? 'Generating…' : 'Generate Invite Code'}
                        </Button>
                    </div>
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
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Verified</TableHead>
                                <TableHead>Employee Profile</TableHead>
                                <TableHead className="pr-6 w-[140px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: 7 }).map((_, j) => (
                                            <TableCell key={j}><Skeleton className="h-5 w-full rounded" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : currentUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-20 text-center">
                                        <div className="bg-muted mx-auto mb-4 flex size-14 items-center justify-center rounded-full">
                                            <Users className="text-muted-foreground size-7" />
                                        </div>
                                        <p className="text-foreground font-semibold">No users found</p>
                                        <p className="text-muted-foreground mt-1 text-sm">
                                            {searchText
                                                ? 'Try a different search term.'
                                                : 'No users in your organization yet.'}
                                        </p>
                                    </TableCell>
                                </TableRow>
                            ) : currentUsers.map(u => (
                                <TableRow key={u.id}>
                                    <TableCell className="pl-6 font-medium">{u.first_name} {u.last_name}</TableCell>
                                    <TableCell className="text-muted-foreground">{u.username}</TableCell>
                                    <TableCell className="text-muted-foreground text-sm">{u.email}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn('capitalize text-xs rounded-full font-medium', ROLE_BADGE[u.role] ?? 'border-border bg-muted text-muted-foreground')}>
                                            {u.role}
                                        </Badge>
                                    </TableCell>
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
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "text-xs rounded-full",
                                                u.employee_profile
                                                    ? "border-primary/20 bg-primary/10 text-primary"
                                                    : "border-border bg-muted text-muted-foreground"
                                            )}
                                        >
                                            {u.employee_profile ? 'Linked' : 'No Profile'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="pr-6 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="sm" className="h-8 px-3 text-xs gap-1.5" asChild>
                                                <Link href={`/users/${u.id}`}><Eye className="size-3.5" /> View</Link>
                                            </Button>
                                            {u.employee_profile && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="size-8" asChild aria-label="Edit employee profile">
                                                            <Link href={`/users/edit-employee-profile/${u.id}`}><Pencil className="size-4" /></Link>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Edit employee profile</TooltipContent>
                                                </Tooltip>
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

            {/* Invitation Code Dialog */}
            <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Invitation Code Generated</DialogTitle>
                        <DialogDescription>
                            Share this code with the user you want to invite to your organization.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col items-center gap-4 py-4">
                        <div className="border-border bg-muted w-full rounded-lg border-2 border-dashed p-6 text-center">
                            <p className="font-mono text-4xl font-bold tracking-widest text-primary">
                                {invitationCode?.code}
                            </p>
                        </div>
                        {invitationCode?.expires_at && (
                            <p className="text-muted-foreground text-xs">
                                Expires: {new Date(invitationCode.expires_at).toLocaleString()}
                            </p>
                        )}
                        <Button className="w-full" onClick={copyToClipboard}>
                            {copied
                                ? <><Check className="mr-2 size-4" /> Copied!</>
                                : <><Copy className="mr-2 size-4" /> Copy Code</>
                            }
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
        </TooltipProvider>
    );
}
