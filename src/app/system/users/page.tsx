import { getUsers } from "./actions";
import { UserManagement } from "./user-management";
import { getSessionContext } from "@/core/services/auth-service";

export default async function UsersPage() {
    const users = await getUsers();
    const session = await getSessionContext();

    return <UserManagement users={users} currentUserId={session?.userId || ""} />;
}
