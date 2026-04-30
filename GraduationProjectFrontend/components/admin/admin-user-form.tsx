"use client";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  AcademicYear,
  AccountStatus,
  ApiUser,
  Department,
  Role,
  Track,
} from "@/lib/api/types";
import { Loader2 } from "lucide-react";

export const NONE_VALUE = "__none__";
type SelectOption<T extends string = string> = {
  value: T;
  label: string;
  description?: string;
};

export const roleOptions: Array<SelectOption<Role>> = [
  { value: "STUDENT", label: "Student" },
  { value: "LEADER", label: "Team Leader" },
  { value: "DOCTOR", label: "Doctor" },
  { value: "TA", label: "TA" },
  { value: "ADMIN", label: "Admin" },
];

export const statusOptions: Array<SelectOption<AccountStatus>> = [
  {
    value: "ACTIVE",
    label: "Active",
    description: "Can sign in and use the system normally.",
  },
  {
    value: "INACTIVE",
    label: "Inactive",
    description:
      "Temporarily disabled. Use this when the account should stay off for now.",
  },
  {
    value: "SUSPENDED",
    label: "Suspended",
    description:
      "Blocked by administrator. Use this for security or policy issues.",
  },
];

export const departmentOptions: Array<{ value: Department; label: string }> = [
  { value: "COMPUTER_SCIENCE", label: "Computer Science" },
  { value: "SOFTWARE_ENGINEERING", label: "Software Engineering" },
  { value: "INFORMATION_TECHNOLOGY", label: "Information Technology" },
  { value: "COMPUTER_ENGINEERING", label: "Computer Engineering" },
  { value: "DATA_SCIENCE", label: "Data Science" },
  { value: "ARTIFICIAL_INTELLIGENCE", label: "Artificial Intelligence" },
  {
    value: "CYBERSECURITY_INFOSEC",
    label: "Cybersecurity / Information Security",
  },
  { value: "INFORMATION_SYSTEMS", label: "Information Systems" },
  { value: "BIOINFORMATICS", label: "Bioinformatics" },
];

export const academicYearOptions: Array<{
  value: AcademicYear;
  label: string;
}> = [
  { value: "YEAR_1", label: "Year 1" },
  { value: "YEAR_2", label: "Year 2" },
  { value: "YEAR_3", label: "Year 3" },
  { value: "YEAR_4", label: "Year 4" },
  { value: "YEAR_5", label: "Year 5" },
];

export const trackOptions: Array<{ value: Track; label: string }> = [
  { value: "FRONTEND_DEVELOPMENT", label: "Frontend Development" },
  { value: "BACKEND_DEVELOPMENT", label: "Backend Development" },
  { value: "FULLSTACK_DEVELOPMENT", label: "Full-Stack Development" },
  { value: "MOBILE_APP_DEVELOPMENT", label: "Mobile App Development" },
  { value: "DEVOPS", label: "DevOps" },
  { value: "CLOUD_ENGINEERING", label: "Cloud Engineering" },
  { value: "SOFTWARE_ARCHITECTURE", label: "Software Architecture" },
  { value: "QUALITY_ASSURANCE", label: "Quality Assurance" },
  { value: "GAME_DEVELOPMENT", label: "Game Development" },
];

export type SelectOrNone<T extends string> = T | typeof NONE_VALUE;

export type AdminUserFormState = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: Role;
  academicId: string;
  phone: string;
  department: SelectOrNone<Department>;
  academicYear: SelectOrNone<AcademicYear>;
  preferredTrack: SelectOrNone<Track>;
  accountStatus: AccountStatus;
};

export function createEmptyUserForm(): AdminUserFormState {
  return {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "STUDENT",
    academicId: "",
    phone: "",
    department: NONE_VALUE,
    academicYear: NONE_VALUE,
    preferredTrack: NONE_VALUE,
    accountStatus: "ACTIVE",
  };
}

export function mapApiUserToAdminForm(user: ApiUser): AdminUserFormState {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    password: "",
    role: user.role,
    academicId: user.academicId ?? "",
    phone: user.phone ?? "",
    department: user.department ?? NONE_VALUE,
    academicYear: user.academicYear ?? NONE_VALUE,
    preferredTrack: user.preferredTrack ?? NONE_VALUE,
    accountStatus: user.accountStatus,
  };
}

type AdminUserFormProps = {
  form: AdminUserFormState;
  actionError: string;
  isSubmitting: boolean;
  submitLabel: string;
  requirePassword: boolean;
  disableStatusChange?: boolean;
  onChange: <K extends keyof AdminUserFormState>(
    key: K,
    value: AdminUserFormState[K],
  ) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

export function AdminUserForm({
  form,
  actionError,
  isSubmitting,
  submitLabel,
  requirePassword,
  disableStatusChange = false,
  onChange,
  onSubmit,
  onCancel,
}: AdminUserFormProps) {
  return (
    <>
      <div className="grid gap-4 py-4 sm:grid-cols-2 sm:gap-5">
        <FormInput
          id="firstName"
          label="First Name *"
          value={form.firstName}
          onChange={(value) => onChange("firstName", value)}
        />
        <FormInput
          id="lastName"
          label="Last Name *"
          value={form.lastName}
          onChange={(value) => onChange("lastName", value)}
        />
        <FormInput
          id="email"
          label="Email *"
          type="email"
          value={form.email}
          onChange={(value) => onChange("email", value)}
          className="sm:col-span-2"
        />
        <FormInput
          id="password"
          label={requirePassword ? "Password *" : "New Password"}
          type="password"
          value={form.password}
          onChange={(value) => onChange("password", value)}
          placeholder={
            requirePassword
              ? "At least 6 characters"
              : "Leave blank to keep the current password"
          }
          className="sm:col-span-2"
        />
        <FormSelect
          label="Role *"
          value={form.role}
          onChange={(value) => onChange("role", value as Role)}
          options={roleOptions}
        />
        <FormSelect
          label="Account Status *"
          value={form.accountStatus}
          onChange={(value) =>
            onChange("accountStatus", value as AccountStatus)
          }
          options={statusOptions}
          disabled={disableStatusChange}
          helperText="Inactive is a temporary disable. Suspended is an admin block for security or policy issues."
        />
        <FormInput
          id="academicId"
          label="Academic ID *"
          value={form.academicId}
          onChange={(value) => onChange("academicId", value)}
          placeholder="e.g. CS2021010 or ADMIN-0001"
        />
        <FormInput
          id="phone"
          label="Phone"
          value={form.phone}
          onChange={(value) => onChange("phone", value)}
        />
        <FormSelect
          label="Department"
          value={form.department}
          onChange={(value) =>
            onChange("department", value as AdminUserFormState["department"])
          }
          options={departmentOptions}
          allowNone
        />
        <FormSelect
          label="Academic Year"
          value={form.academicYear}
          onChange={(value) =>
            onChange(
              "academicYear",
              value as AdminUserFormState["academicYear"],
            )
          }
          options={academicYearOptions}
          allowNone
        />
        <FormSelect
          label="Preferred Track"
          value={form.preferredTrack}
          onChange={(value) =>
            onChange(
              "preferredTrack",
              value as AdminUserFormState["preferredTrack"],
            )
          }
          options={trackOptions}
          allowNone
          className="sm:col-span-2"
        />
      </div>

      {actionError ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {actionError}
        </div>
      ) : null}

      <DialogFooter className="flex-col-reverse gap-2 border-t border-border/50 pt-4 sm:flex-row sm:justify-end">
        <Button
          variant="outline"
          className="w-full sm:w-auto"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="button"
          className="w-full sm:w-auto"
          onClick={onSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {submitLabel}
        </Button>
      </DialogFooter>
    </>
  );
}

function FormInput({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  className = "",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`.trim()}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        className="h-11"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function FormSelect({
  label,
  value,
  onChange,
  options,
  allowNone = false,
  disabled = false,
  className = "",
  helperText,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<SelectOption>;
  allowNone?: boolean;
  disabled?: boolean;
  className?: string;
  helperText?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`.trim()}>
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="h-11">
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          {allowNone ? (
            <SelectItem value={NONE_VALUE}>Not assigned</SelectItem>
          ) : null}
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {helperText ? (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
