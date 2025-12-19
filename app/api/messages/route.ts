export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { Messages } from "@/db/repository";

export async function GET(req: NextRequest) {
    const threadId = req.nextUrl.searchParams.get("threadId");
    if (!threadId) {
        return NextResponse.json({ error: "threadId is required" }, { status: 400 });
    }

    try {
        const messages = Messages.getByThread(threadId);
        return NextResponse.json(messages);
    } catch {
        return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { threadId, content, role } = await req.json();

        if (!threadId || !content || !role) {
            return NextResponse.json({ error: "threadId, content, role are required" }, { status: 400 });
        }

        if (!['user', 'assistant'].includes(role)) {
            return NextResponse.json({ error: "role must be 'user' or 'assistant'" }, { status: 400 });
        }

        const message = Messages.create(threadId, role, content);
        return NextResponse.json({ success: true, message });
    } catch {
        return NextResponse.json({ error: "Failed to create message" }, { status: 500 });
    }
}
