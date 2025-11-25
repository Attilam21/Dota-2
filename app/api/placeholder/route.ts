import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "Placeholder API endpoint",
    status: "ok",
  });
}
