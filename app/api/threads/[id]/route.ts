export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { Threads } from "@/db/repository";

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { title } = await req.json();

        if (!title || typeof title !== 'string' || title.trim() === '') {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        const success = Threads.updateTitle(id, title.trim());

        if (!success) {
            return NextResponse.json({ error: "Thread not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: "Thread title updated",
            threadId: id,
            title: title.trim()
        });

    } catch {
        return NextResponse.json({ error: "Failed to update thread" }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const deleteThreadSuccess = Threads.delete(id);

        if (!deleteThreadSuccess) {
            return NextResponse.json({ error: "Thread not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: "Thread deleted successfully",
            threadId: id
        });

    } catch {
        return NextResponse.json({ error: "Failed to delete thread" }, { status: 500 });
    }
}
