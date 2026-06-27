import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("webapp_access_token")?.value || request.cookies.get("webapp_refresh_token")?.value;
    if (!token) {
      return NextResponse.json(
        { isAuthenticated: false },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { isAuthenticated: true },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { isAuthenticated: false, message: "Internal server error" },
      { status: 200 }
    );
  }
}
