"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AdminUserForm,
  createEmptyUserForm,
  departmentOptions,
  mapApiUserToAdminForm,
  NONE_VALUE,
  roleOptions,
  statusOptions,
  type AdminUserFormState,
} from "@/components/admin/admin-user-form";
import { ApiRequestError } from "@/lib/api/http";
import { mapApiUserToUiUser } from "@/lib/api/mappers";
import { usersApi } from "@/lib/api/users";
import { isUserProfileIncomplete } from "@/lib/auth/profile-completion";
import type {
  AccountStatus,
  ApiUser,
  Role,
  UsersSummary,
} from "@/lib/api/types";
import { useAuthStore } from "@/lib/stores/auth-store";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle2,
  Crown,
  GraduationCap,
  Loader2,
  Lock,
  MailCheck,
  Pencil,
  Plus,
  Search,
  Shield,
  Trash2,
  UserRound,
  Users,
  type LucideIcon,
  XCircle,
} from "lucide-react";

const PAGE_SIZE = 10;
const ALL_VALUE = "ALL";

type SummaryCardItem = {
  title: string;
  value: number;
  subtitle: string;
  icon: LucideIcon;
  tone: string;
  surface: string;
};

function roleLabel(role: Role) {
  return roleOptions.find((option) => option.value === role)?.label ?? role;
}

function statusLabel(status: AccountStatus) {
  return (
    statusOptions.find((option) => option.value === status)?.label ?? status
  );
}

function statusDescription(status: AccountStatus) {
  return (
    statusOptions.find((option) => option.value === status)?.description ?? ""
  );
}

function formatError(error: unknown) {
  if (error instanceof ApiRequestError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

function normalizeOptionalText(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeOptionalSelect<T extends string>(
  value: T | typeof NONE_VALUE,
) {
  return value === NONE_VALUE ? null : value;
}

function avatarFallback(
  user: Pick<ApiUser, "firstName" | "lastName" | "email">,
) {
  const initials =
    `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.trim();
  return (initials || user.email.slice(0, 2)).toUpperCase();
}

function roleBadgeClass(role: Role) {
  return role === "ADMIN"
    ? "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400"
    : role === "LEADER"
      ? "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
      : role === "DOCTOR"
        ? "border-purple-500/20 bg-purple-500/10 text-purple-600 dark:text-purple-400"
        : role === "TA"
          ? "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400"
          : "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
}

function statusBadgeClass(status: AccountStatus) {
  return status === "ACTIVE"
    ? "border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400"
    : status === "INACTIVE"
      ? "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
      : "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400";
}

function verificationBadgeClass(isEmailVerified: boolean) {
  return isEmailVerified
    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
    : "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400";
}

function profileCompletionBadgeClass(isIncomplete: boolean) {
  return isIncomplete
    ? "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
    : "border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400";
}

function displayAcademicId(user: Pick<ApiUser, "academicId">) {
  const academicId = String(user.academicId ?? "").trim();

  if (!academicId) return "Not assigned";
  if (academicId.startsWith("OAUTH-")) return "Pending profile completion";

  return academicId;
}

function validateForm(form: AdminUserFormState, requirePassword: boolean) {
  if (
    !form.firstName.trim() ||
    !form.lastName.trim() ||
    !form.email.trim() ||
    !form.academicId.trim()
  ) {
    return "First name, last name, email, and academic ID are required.";
  }
  if (requirePassword && form.password.trim().length < 6) {
    return "Password must be at least 6 characters.";
  }
  return "";
}

export default function AdminPage() {
  const { currentUser, hasHydrated, setCurrentUser } = useAuthStore();
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [summary, setSummary] = useState<UsersSummary | null>(null);
  const [meta, setMeta] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role | typeof ALL_VALUE>(
    ALL_VALUE,
  );
  const [selectedStatus, setSelectedStatus] = useState<
    AccountStatus | typeof ALL_VALUE
  >(ALL_VALUE);
  const [pageError, setPageError] = useState("");
  const [actionError, setActionError] = useState("");
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null);
  const [form, setForm] = useState(createEmptyUserForm());
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => setPage(1), [selectedRole, selectedStatus]);

  useEffect(() => {
    if (!hasHydrated || currentUser?.role !== "admin") return;

    let cancelled = false;
    setIsLoadingUsers(true);
    setPageError("");

    usersApi
      .list({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        role: selectedRole === ALL_VALUE ? undefined : selectedRole,
        status: selectedStatus === ALL_VALUE ? undefined : selectedStatus,
      })
      .then((result) => {
        if (cancelled) return;
        setUsers(result.items);
        setMeta(result.meta);
      })
      .catch((error) => {
        if (cancelled) return;
        setPageError(formatError(error));
      })
      .finally(() => {
        if (!cancelled) setIsLoadingUsers(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    currentUser?.role,
    debouncedSearch,
    hasHydrated,
    page,
    refreshKey,
    selectedRole,
    selectedStatus,
  ]);

  useEffect(() => {
    if (!hasHydrated || currentUser?.role !== "admin") return;

    let cancelled = false;
    setIsLoadingSummary(true);

    usersApi
      .summary()
      .then((result) => {
        if (cancelled) return;
        setSummary(result);
      })
      .catch((error) => {
        if (cancelled) return;
        setPageError((value) => value || formatError(error));
      })
      .finally(() => {
        if (!cancelled) setIsLoadingSummary(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentUser?.role, hasHydrated, refreshKey]);

  const selectedIsSelf = selectedUser?.id === currentUser?.id;
  const totalPages = Math.max(meta.totalPages, 1);
  const usersCountText = isLoadingUsers
    ? "Loading users..."
    : `Showing ${users.length} of ${meta.total} users`;

  const summaryCards: SummaryCardItem[] = [
    {
      title: "Total Users",
      value: summary?.totalUsers ?? 0,
      subtitle: "All real backend accounts",
      icon: Users,
      tone: "text-blue-600 dark:text-blue-400",
      surface: "bg-blue-500/10",
    },
    {
      title: "Team Leaders",
      value: summary?.byRole.leaders ?? 0,
      subtitle: "Leader-specific dashboard access",
      icon: Crown,
      tone: "text-amber-600 dark:text-amber-400",
      surface: "bg-amber-500/10",
    },
    {
      title: "Active Users",
      value: summary?.byStatus.active ?? 0,
      subtitle: "Ready to sign in",
      icon: CheckCircle2,
      tone: "text-green-600 dark:text-green-400",
      surface: "bg-green-500/10",
    },
    {
      title: "Needs Attention",
      value:
        (summary?.byStatus.inactive ?? 0) + (summary?.byStatus.suspended ?? 0),
      subtitle: "Temporarily disabled or blocked by admin",
      icon: AlertTriangle,
      tone: "text-red-600 dark:text-red-400",
      surface: "bg-red-500/10",
    },
    {
      title: "Unverified",
      value: summary?.unverified ?? 0,
      subtitle: "Email verification still pending",
      icon: MailCheck,
      tone: "text-violet-600 dark:text-violet-400",
      surface: "bg-violet-500/10",
    },
  ];

  const resetDialogs = () => {
    setActionError("");
    setSelectedUser(null);
    setForm(createEmptyUserForm());
  };

  const updateForm = <K extends keyof AdminUserFormState>(
    key: K,
    value: AdminUserFormState[K],
  ) => setForm((current) => ({ ...current, [key]: value }));

  const refreshData = () => setRefreshKey((value) => value + 1);

  async function handleCreate() {
    const validationError = validateForm(form, true);
    if (validationError) return setActionError(validationError);

    setIsSubmitting(true);
    setActionError("");

    try {
      await usersApi.create({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        academicId: form.academicId.trim(),
        accountStatus: form.accountStatus,
        phone: normalizeOptionalText(form.phone),
        department: normalizeOptionalSelect(form.department),
        academicYear: normalizeOptionalSelect(form.academicYear),
        preferredTrack: normalizeOptionalSelect(form.preferredTrack),
      });

      setPage(1);
      setIsAddOpen(false);
      resetDialogs();
      refreshData();
    } catch (error) {
      setActionError(formatError(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdate() {
    if (!selectedUser) return;

    const validationError = validateForm(form, false);
    if (validationError) return setActionError(validationError);

    setIsSubmitting(true);
    setActionError("");

    try {
      const updated = await usersApi.updateById(selectedUser.id, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        role: form.role,
        academicId: form.academicId.trim(),
        accountStatus: form.accountStatus,
        phone: normalizeOptionalText(form.phone),
        department: normalizeOptionalSelect(form.department),
        academicYear: normalizeOptionalSelect(form.academicYear),
        preferredTrack: normalizeOptionalSelect(form.preferredTrack),
        ...(form.password.trim() ? { password: form.password } : {}),
      });

      if (selectedUser.id === currentUser?.id) {
        setCurrentUser(mapApiUserToUiUser(updated));
      }

      setIsEditOpen(false);
      resetDialogs();
      refreshData();
    } catch (error) {
      setActionError(formatError(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!selectedUser) return;

    setIsDeleting(true);
    setActionError("");

    try {
      await usersApi.deleteById(selectedUser.id);

      if (page > 1 && users.length === 1) {
        setPage((current) => Math.max(1, current - 1));
      }

      setIsDeleteOpen(false);
      resetDialogs();
      refreshData();
    } catch (error) {
      setActionError(formatError(error));
    } finally {
      setIsDeleting(false);
    }
  }

  if (!hasHydrated) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading admin workspace...
        </div>
      </div>
    );
  }

  if (currentUser?.role !== "admin") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-md border-border/50 p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
            <Lock className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Only administrators can open real user management controls.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={120}>
      <div className="mx-auto max-w-7xl space-y-5 pb-6">
        <section className="rounded-[28px] border border-border/60 bg-card/95 p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Shield className="h-3.5 w-3.5" />
                Backend User Management
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Admin User Management
                </h1>
                <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                  Manage students, team leaders, doctors, TAs, and admins with
                  real backend data in a layout that stays clear on both mobile
                  and desktop.
                </p>
              </div>
            </div>

            <div className="flex sm:justify-start xl:justify-end">
              <Button
                className="h-11 w-full sm:w-auto"
                onClick={() => {
                  resetDialogs();
                  setIsAddOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {summaryCards.map((card) => (
              <SummaryStatCard
                key={card.title}
                {...card}
                isLoading={isLoadingSummary}
              />
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-border/60 bg-card/95 p-4 shadow-sm sm:p-6">
          <div className="space-y-5">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
                  Users
                </h2>
                <p className="text-sm text-muted-foreground">
                  Search, filter, edit, and delete real accounts without
                  squeezing the interface on smaller screens.
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                {usersCountText}
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_220px_220px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search by name, email, or academic ID"
                  className="h-11 pl-9"
                />
              </div>

              <Select
                value={selectedRole}
                onValueChange={(value) =>
                  setSelectedRole(value as Role | typeof ALL_VALUE)
                }
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>All Roles</SelectItem>
                  {roleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedStatus}
                onValueChange={(value) =>
                  setSelectedStatus(value as AccountStatus | typeof ALL_VALUE)
                }
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>All Statuses</SelectItem>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2 rounded-2xl border border-border/50 bg-muted/20 p-3 text-xs leading-relaxed text-muted-foreground sm:grid-cols-2">
              <p>
                <span className="font-medium text-foreground">Inactive:</span>{" "}
                temporarily disables access.
              </p>
              <p>
                <span className="font-medium text-foreground">Suspended:</span>{" "}
                blocks access for security or policy issues.
              </p>
            </div>

            {pageError ? (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {pageError}
              </div>
            ) : null}

            <div className="space-y-3 lg:hidden">
              {isLoadingUsers ? (
                <div className="flex h-36 items-center justify-center rounded-2xl border border-border/50 bg-background/70 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading users...
                </div>
              ) : users.length === 0 ? (
                <div className="rounded-2xl border border-border/50 bg-background/70 px-4 py-10 text-center">
                  <p className="font-medium">No users found</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Try changing the filters or create a new account from the
                    admin dialog.
                  </p>
                </div>
              ) : (
                users.map((user) => (
                  <MobileUserCard
                    key={user.id}
                    user={user}
                    isCurrentAdmin={user.id === currentUser?.id}
                    onEdit={() => {
                      setActionError("");
                      setSelectedUser(user);
                      setForm(mapApiUserToAdminForm(user));
                      setIsEditOpen(true);
                    }}
                    onDelete={() => {
                      setActionError("");
                      setSelectedUser(user);
                      setIsDeleteOpen(true);
                    }}
                  />
                ))
              )}
            </div>

            <div className="hidden overflow-hidden rounded-2xl border border-border/60 bg-background/70 lg:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="min-w-[280px]">User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Academic ID</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingUsers ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-36 text-center">
                        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading users...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-36 text-center">
                        <div className="space-y-2">
                          <p className="font-medium">No users found</p>
                          <p className="text-sm text-muted-foreground">
                            Try changing the filters or create a new account
                            from the admin dialog.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => {
                      const isCurrentAdmin = user.id === currentUser?.id;
                      const isProfileIncomplete = isUserProfileIncomplete(user);

                      return (
                        <TableRow key={user.id} className="hover:bg-muted/20">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-11 w-11 border border-border/50">
                                <AvatarImage
                                  src={user.avatarUrl ?? undefined}
                                />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {avatarFallback(user)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="truncate font-medium">
                                    {user.fullName}
                                  </p>
                                  {isCurrentAdmin ? (
                                    <Badge
                                      variant="outline"
                                      className="border-primary/20 bg-primary/10 text-primary"
                                    >
                                      You
                                    </Badge>
                                  ) : null}
                                  <Badge
                                    variant="outline"
                                    className={cn(verificationBadgeClass(user.isEmailVerified))}
                                  >
                                    {user.isEmailVerified
                                      ? "Email verified"
                                      : "Email pending"}
                                  </Badge>
                                  {isProfileIncomplete ? (
                                    <Badge
                                      variant="outline"
                                      className={cn(profileCompletionBadgeClass(true))}
                                    >
                                      Profile incomplete
                                    </Badge>
                                  ) : null}
                                </div>
                                <p className="truncate text-sm text-muted-foreground">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <UserRoleBadge role={user.role} />
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {displayAcademicId(user)}
                          </TableCell>
                          <TableCell>
                            {departmentOptions.find(
                              (option) => option.value === user.department,
                            )?.label ?? "Not assigned"}
                          </TableCell>
                          <TableCell>
                            <UserStatusBadge status={user.accountStatus} />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  setActionError("");
                                  setSelectedUser(user);
                                  setForm(mapApiUserToAdminForm(user));
                                  setIsEditOpen(true);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-red-500 hover:text-red-600"
                                disabled={isCurrentAdmin}
                                onClick={() => {
                                  setActionError("");
                                  setSelectedUser(user);
                                  setIsDeleteOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col gap-3 border-t border-border/50 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Page {meta.page} of {totalPages}
              </p>
              <div className="flex gap-2 sm:justify-end">
                <Button
                  variant="outline"
                  className="flex-1 sm:flex-none"
                  disabled={page <= 1}
                  onClick={() => setPage((value) => value - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 sm:flex-none"
                  disabled={page >= totalPages}
                  onClick={() => setPage((value) => value + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </section>

        <Dialog
          open={isAddOpen}
          onOpenChange={(open) => {
            setIsAddOpen(open);
            if (!open) resetDialogs();
          }}
        >
          <DialogContent className="max-h-[90vh] overflow-y-auto border-border/60 sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create User</DialogTitle>
              <DialogDescription>
                Admin-created accounts are verified automatically and can sign
                in immediately with the password you set.
              </DialogDescription>
            </DialogHeader>
            <AdminUserForm
              form={form}
              actionError={actionError}
              isSubmitting={isSubmitting}
              submitLabel="Create User"
              requirePassword
              onChange={updateForm}
              onSubmit={handleCreate}
              onCancel={() => setIsAddOpen(false)}
            />
          </DialogContent>
        </Dialog>

        <Dialog
          open={isEditOpen}
          onOpenChange={(open) => {
            setIsEditOpen(open);
            if (!open) resetDialogs();
          }}
        >
          <DialogContent className="max-h-[90vh] overflow-y-auto border-border/60 sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update role, academic data, account status, and password without
                leaving the admin workspace.
              </DialogDescription>
            </DialogHeader>

            {selectedUser ? (
              <>
                {(() => {
                  const isProfileIncomplete = isUserProfileIncomplete(selectedUser);

                  return (
                <div className="rounded-2xl border border-border/50 bg-muted/20 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border border-border/50">
                      <AvatarImage src={selectedUser.avatarUrl ?? undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {avatarFallback(selectedUser)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 space-y-1">
                      <p className="truncate font-semibold">
                        {selectedUser.fullName}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {selectedUser.email}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <UserRoleBadge role={selectedUser.role} />
                    <UserStatusBadge status={selectedUser.accountStatus} />
                    <Badge
                      variant="outline"
                      className={cn(
                        verificationBadgeClass(selectedUser.isEmailVerified),
                      )}
                    >
                      {selectedUser.isEmailVerified
                        ? "Email verified"
                        : "Email pending"}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        profileCompletionBadgeClass(isProfileIncomplete),
                      )}
                    >
                      {isProfileIncomplete
                        ? "Profile incomplete"
                        : "Profile complete"}
                    </Badge>
                  </div>
                  {isProfileIncomplete ? (
                    <p className="mt-3 text-xs text-muted-foreground">
                      This account still needs required academic details such as
                      phone, department, academic year, preferred track, or a
                      real academic ID.
                    </p>
                  ) : null}
                  {selectedIsSelf ? (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Your own account cannot be set to temporarily disabled or
                      suspended from this screen.
                    </p>
                  ) : null}
                </div>
                  );
                })()}

                <AdminUserForm
                  form={form}
                  actionError={actionError}
                  isSubmitting={isSubmitting}
                  submitLabel="Save Changes"
                  requirePassword={false}
                  disableStatusChange={selectedIsSelf}
                  onChange={updateForm}
                  onSubmit={handleUpdate}
                  onCancel={() => setIsEditOpen(false)}
                />
              </>
            ) : null}
          </DialogContent>
        </Dialog>

        <Dialog
          open={isDeleteOpen}
          onOpenChange={(open) => {
            setIsDeleteOpen(open);
            if (!open) {
              setActionError("");
              setSelectedUser(null);
            }
          }}
        >
          <DialogContent className="border-border/60 sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertTriangle className="h-5 w-5" />
                Delete User
              </DialogTitle>
              <DialogDescription>
                This permanently removes the user account. The backend still
                protects self-delete and last-active-admin cases.
              </DialogDescription>
            </DialogHeader>

            {selectedUser ? (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                <p className="font-semibold">{selectedUser.fullName}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedUser.email}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Role: {roleLabel(selectedUser.role)} | Status:{" "}
                  {statusLabel(selectedUser.accountStatus)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {statusDescription(selectedUser.accountStatus)}
                </p>
              </div>
            ) : null}

            {actionError ? (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {actionError}
              </div>
            ) : null}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setIsDeleteOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="w-full sm:w-auto"
                onClick={handleDelete}
                disabled={isDeleting || selectedIsSelf}
              >
                {isDeleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Delete User
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

function SummaryStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone,
  surface,
  isLoading,
}: SummaryCardItem & { isLoading: boolean }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-background/75 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {title}
          </p>
          <p className="text-2xl font-bold tracking-tight">
            {isLoading ? "..." : value}
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {subtitle}
          </p>
        </div>
        <div className={cn("rounded-2xl p-2.5", surface)}>
          <Icon className={cn("h-5 w-5", tone)} />
        </div>
      </div>
    </div>
  );
}

function UserRoleBadge({ role }: { role: Role }) {
  return (
    <Badge variant="outline" className={cn("gap-1.5", roleBadgeClass(role))}>
      <RoleGlyph role={role} />
      {roleLabel(role)}
    </Badge>
  );
}

function RoleGlyph({ role }: { role: Role }) {
  if (role === "ADMIN") return <Shield className="h-3.5 w-3.5" />;
  if (role === "LEADER") return <Crown className="h-3.5 w-3.5" />;
  if (role === "DOCTOR") return <GraduationCap className="h-3.5 w-3.5" />;
  if (role === "TA") return <UserRound className="h-3.5 w-3.5" />;
  return <Users className="h-3.5 w-3.5" />;
}

function UserStatusBadge({
  status,
  withTooltip = true,
}: {
  status: AccountStatus;
  withTooltip?: boolean;
}) {
  const icon =
    status === "ACTIVE" ? (
      <CheckCircle2 className="h-3.5 w-3.5" />
    ) : status === "INACTIVE" ? (
      <XCircle className="h-3.5 w-3.5" />
    ) : (
      <AlertTriangle className="h-3.5 w-3.5" />
    );

  const badge = (
    <Badge
      variant="outline"
      className={cn("gap-1.5", statusBadgeClass(status))}
    >
      {icon}
      {statusLabel(status)}
    </Badge>
  );

  if (!withTooltip) return badge;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent className="max-w-60 text-sm">
        {statusDescription(status)}
      </TooltipContent>
    </Tooltip>
  );
}

function MobileUserCard({
  user,
  isCurrentAdmin,
  onEdit,
  onDelete,
}: {
  user: ApiUser;
  isCurrentAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const departmentLabel =
    departmentOptions.find((option) => option.value === user.department)
      ?.label ?? "Not assigned";
  const isProfileIncomplete = isUserProfileIncomplete(user);

  return (
    <article className="rounded-2xl border border-border/60 bg-background/80 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <Avatar className="h-12 w-12 border border-border/50">
          <AvatarImage src={user.avatarUrl ?? undefined} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {avatarFallback(user)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-semibold">{user.fullName}</p>
            {isCurrentAdmin ? (
              <Badge
                variant="outline"
                className="border-primary/20 bg-primary/10 text-primary"
              >
                You
              </Badge>
            ) : null}
          </div>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <UserRoleBadge role={user.role} />
        <UserStatusBadge status={user.accountStatus} withTooltip={false} />
        <Badge
          variant="outline"
          className={cn(verificationBadgeClass(user.isEmailVerified))}
        >
          {user.isEmailVerified ? "Email verified" : "Email pending"}
        </Badge>
        {isProfileIncomplete ? (
          <Badge
            variant="outline"
            className={cn(profileCompletionBadgeClass(true))}
          >
            Profile incomplete
          </Badge>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 rounded-2xl border border-border/40 bg-muted/20 p-3 sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Academic ID
          </p>
          <p className="mt-1 text-sm">
            {displayAcademicId(user)}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Department
          </p>
          <p className="mt-1 text-sm">{departmentLabel}</p>
        </div>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        {statusDescription(user.accountStatus)}
      </p>
      {isProfileIncomplete ? (
        <p className="mt-2 text-xs leading-relaxed text-amber-600 dark:text-amber-400">
          This account still needs the required profile details.
        </p>
      ) : null}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button variant="outline" className="w-full sm:flex-1" onClick={onEdit}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </Button>
        <Button
          variant="outline"
          className="w-full border-red-500/20 text-red-600 hover:bg-red-500/10 hover:text-red-700 sm:flex-1"
          disabled={isCurrentAdmin}
          onClick={onDelete}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>
    </article>
  );
}
