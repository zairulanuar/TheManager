import { getSessionContext } from '@/core/services/auth-service';
import { getChatSessions } from './actions';
import ChatClient from './chat-client';
import { redirect } from 'next/navigation';

export default async function AIChatPage() {
    const session = await getSessionContext();
    if (!session) {
        redirect('/auth/login');
    }

    const sessions = await getChatSessions();
    
    // Serialize dates for client component
    const serializedSessions = sessions.map((s: any) => ({
        id: s.id,
        title: s.title,
        updatedAt: s.updatedAt.toISOString(),
        // We don't pass messages here to keep payload light, client will fetch them
    }));

    // Check role safely
    // session.role might be an object (from include) or undefined
    // session.roleType is a field on user
    // @ts-ignore
    const userRole = session.role?.type || session.roleType || 'USER';
    // @ts-ignore
    const userName = session.name || session.firstName || 'User';

    return (
        <div className="h-full">
            <ChatClient 
                initialSessions={serializedSessions} 
                userRole={userRole} 
                userId={session.userId} 
                userName={userName}
                userAvatar={session.image}
            />
        </div>
    );
}