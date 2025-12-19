export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { Threads } from "@/db/repository";

export async function GET() {
  try {
    const threads = Threads.getAll();
    return NextResponse.json(threads);
  } catch (error) {
    console.error("GET /api/threads error:", error);
    return NextResponse.json(
      { error: "Failed to fetch threads", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title } = await req.json();

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json(
        { error: "Title is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    const newThread = Threads.create(title.trim());
    return NextResponse.json(newThread, { status: 201 });

  } catch (error) {
    console.error("POST /api/threads error:", error);
    return NextResponse.json(
      { error: "Failed to create thread", details: String(error) },
      { status: 500 }
    );
  }
}
