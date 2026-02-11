"use client";

import UserForm from "../../user-form";
import { RoleType } from "@prisma/client";

interface EditUserFormProps {
    user: any; // Using any to match the loose typing, but ideally should be the specific type
    isSuperAdmin?: boolean;
}

export default function EditUserForm({ user, isSuperAdmin = false }: EditUserFormProps) {
    return <UserForm initialData={user} isEdit={true} isSuperAdmin={isSuperAdmin} />;
}
