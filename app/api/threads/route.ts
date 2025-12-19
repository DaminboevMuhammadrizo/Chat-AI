export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { Threads } from "@/db/repository";

export async function GET() {
    try {
        const threads = Threads.getAll();
        return NextResponse.json(threads);
    } catch {
        return NextResponse.json({ error: "Failed to fetch threads" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { title } = await req.json();

        if (!title || typeof title !== 'string' || title.trim() === '') {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        const newThread = Threads.create(title.trim());
        return NextResponse.json(newThread, { status: 201 });

    } catch {
        return NextResponse.json({ error: "Failed to create thread" }, { status: 500 });
    }
}
