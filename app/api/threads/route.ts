export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { Threads } from "@/db/repository";


export async function GET() {
  try {
    console.log("GET /api/threads called");
    const threads = Threads.getAll();
    console.log("Threads found:", threads.length);
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
    console.log("POST /api/threads called");
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
