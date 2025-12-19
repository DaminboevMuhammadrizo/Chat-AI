export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { Messages } from "@/db/repository.js";
import { Role } from "@/db/roles";

export async function GET(req: NextRequest) {
  const threadId = req.nextUrl.searchParams.get("threadId");
  if (!threadId) {
    return NextResponse.json({ error: "threadId is required" }, { status: 400 });
  }

  const messages = Messages.getByThread(threadId);
  return NextResponse.json(messages);
}

export async function POST(req: NextRequest) {
  try {
    const { threadId, content, role } = await req.json();

    if (!threadId || !content || !role) {
      return NextResponse.json(
        { error: "threadId, content, role are required" },
        { status: 400 }
      );
    }

    const message = Messages.create(threadId, role as Role, content);
    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error("POST /api/messages error:", error);
    return NextResponse.json(
      { error: "Failed to create message", details: String(error) },
      { status: 500 }
    );
  }
}
