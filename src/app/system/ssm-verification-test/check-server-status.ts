"use server";

export async function checkServerStatus() {
    try {
        const hfUrl = process.env.HF_API_URL;
        const hfToken = process.env.HF_TOKEN;

        if (!hfUrl) {
            return { status: "offline", message: "No HF_API_URL configured" };
        }

        const headers: HeadersInit = {};
        if (hfToken) {
            headers["Authorization"] = `Bearer ${hfToken}`;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const response = await fetch(hfUrl, {
            method: "GET",
            headers,
            signal: controller.signal,
            cache: "no-store"
        });

        clearTimeout(timeoutId);

        if (response.ok) {
            return { status: "online" };
        } else {
            return { status: "offline", message: `HTTP ${response.status}` };
        }
    } catch (error) {
        return { status: "offline", message: error instanceof Error ? error.message : "Unknown error" };
    }
}
