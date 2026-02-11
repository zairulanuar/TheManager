"use client";
export default function ImpersonationBanner({ impersonatorId, targetUser }: any) {
    if (!impersonatorId) return null;
    return (
        <div className="bg-amber-500 text-white px-4 py-2 flex justify-between items-center text-xs font-bold sticky top-0 z-[999]">
            <span>IMPERSONATING: {targetUser}</span>
            <button className="bg-white text-amber-600 px-2 py-1 rounded">EXIT</button>
        </div>
    );
}