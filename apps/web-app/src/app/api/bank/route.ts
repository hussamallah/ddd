import { NextResponse } from "next/server";

// Force dynamic so we don't use a build-time snapshot:
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const bank = (await import("@/data/quizBank.json")).default;
    return NextResponse.json(bank, {
      headers: { 
        "Cache-Control": "no-store, max-age=0",
        "Content-Type": "application/json"
      },
    });
  } catch (error) {
    console.error("Failed to load quiz bank:", error);
    return NextResponse.json(
      { error: "Failed to load quiz bank" },
      { status: 500 }
    );
  }
}
