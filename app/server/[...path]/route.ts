export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBackendUrl } from "@/lib/config";

// ─── Backend base URL ─────────────────────────────────────────────────────────
function getBackendBase(): string {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    throw new Error("BACKEND_URL or NEXT_PUBLIC_BACKEND_URL is required.");
  }
  return `${backendUrl}/api`;
}

// ─── Concurrent-refresh deduplication ────────────────────────────────────────
// Keyed by refresh token string; value is a Promise resolving to { access, refresh } | null
const refreshInProgress = new Map<string, Promise<{ access: string; refresh: string | null } | null>>();

async function refreshAccessToken(refreshToken: string, base: string): Promise<{ access: string; refresh: string | null } | null> {
  const existing = refreshInProgress.get(refreshToken);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const res = await fetch(`${base}/auth/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
        cache: "no-store",
      });
      if (!res.ok) return null;
      const data = await res.json();
      const newAccess = data.access || data.data?.access;
      const newRefresh = data.refresh || data.data?.refresh || null;
      if (!newAccess) return null;
      return { access: newAccess as string, refresh: newRefresh as string | null };
    } catch {
      return null;
    } finally {
      // Remove from map after a short delay so other in-flight requests can still
      // await the same promise before it is evicted.
      setTimeout(() => refreshInProgress.delete(refreshToken), 2000);
    }
  })();

  refreshInProgress.set(refreshToken, promise);
  return promise;
}

// ─── Main proxy handler ───────────────────────────────────────────────────────
async function handleRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  let path = resolvedParams.path.join("/");
  if (path.startsWith("api/")) path = path.substring(4);

  const url = new URL(request.url);
  const searchParams = url.searchParams.toString();

  const base = getBackendBase();
  const cleanPath = path.replace(/^\//, "").replace(/\/$/, "");
  const backendUrl = `${base}/${cleanPath}/${searchParams ? "?" + searchParams : ""}`;

  const isAuthEndpoint =
    path.includes("auth/login") ||
    path.includes("auth/refresh") ||
    path.includes("auth/logout") ||
    path.includes("auth/google-login") ||
    path.includes("auth/complete-password-setup") ||
    path.includes("auth/setup-password") ||
    path.includes("auth/forgot-password") ||
    path.includes("auth/reset-password");

  const cookieStore = await cookies();
  const token = cookieStore.get("webapp_access_token")?.value;

  // ─── SINGLE DASHBOARD ENDPOINT FORWARDER ──────────────────────────────────────
  if (request.method === "GET" && (cleanPath === "mobile/dashboard" || cleanPath === "dashboard/stats" || cleanPath === "dashboard")) {
    const authHeader: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const res = await fetch(`${base}/mobile/dashboard/`, { headers: authHeader, cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data, { status: 200 });
      }
    } catch {
      // Fallback to normal proxy
    }
  }

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  if (!isAuthEndpoint && token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let body: BodyInit | null = null;
  if (request.method !== "GET" && request.method !== "HEAD") {
    if (contentType && contentType.includes("multipart/form-data")) {
      body = await request.formData();
      headers.delete("content-type");
    } else if (path.includes("auth/logout")) {
      const refreshToken = cookieStore.get("webapp_refresh_token")?.value;
      body = JSON.stringify({ refresh: refreshToken || "" });
    } else {
      const text = await request.text();
      body = text || null;
    }
  }

  const isHttps =
    request.nextUrl.protocol === "https:" ||
    request.headers.get("x-forwarded-proto") === "https";

  const cookieOptions = {
    httpOnly: true,
    secure: isHttps,
    sameSite: "lax" as const,
    path: "/",
    ...(process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {}),
  };

  const setAuthCookies = (
    res: NextResponse,
    access: string | null,
    refresh: string | null
  ) => {
    if (access) {
      res.cookies.set("webapp_access_token", access, {
        ...cookieOptions,
        maxAge: 60 * 15, // 15 min
      });
    }
    if (refresh) {
      res.cookies.set("webapp_refresh_token", refresh, {
        ...cookieOptions,
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }
  };

  try {
    let response = await fetch(backendUrl, {
      method: request.method,
      headers,
      body,
      redirect: "manual",
      cache: "no-store",
    });

    let refreshedAccess: string | null = null;
    let refreshedRefresh: string | null = null;

    // ── Token refresh on 401 ────────────────────────────────────────────────
    if (response.status === 401 && !isAuthEndpoint) {
      const refreshToken = cookieStore.get("webapp_refresh_token")?.value;
      if (refreshToken) {
        const refreshResult = await refreshAccessToken(refreshToken, base);
        if (refreshResult) {
          refreshedAccess = refreshResult.access;
          refreshedRefresh = refreshResult.refresh;

          headers.set("Authorization", `Bearer ${refreshedAccess}`);
          response = await fetch(backendUrl, {
            method: request.method,
            headers,
            body,
            redirect: "manual",
            cache: "no-store",
          });
        } else {
          // Refresh failed → clear cookies and signal re-login
          const nextRes = NextResponse.json(
            { success: false, message: "Session expired. Please sign in again." },
            { status: 401 }
          );
          nextRes.cookies.set("webapp_access_token", "", { maxAge: 0, path: "/" });
          nextRes.cookies.set("webapp_refresh_token", "", { maxAge: 0, path: "/" });
          return nextRes;
        }
      }
    }

    // ── Build response ──────────────────────────────────────────────────────
    if (response.status === 204 || response.status === 205) {
      const nextRes = new NextResponse(null, { status: response.status });
      setAuthCookies(nextRes, refreshedAccess, refreshedRefresh);
      return nextRes;
    }

    const resContentType = response.headers.get("content-type");
    if (resContentType && resContentType.includes("application/json")) {
      const data = await response.json();

      let access = refreshedAccess;
      let refresh = refreshedRefresh;

      // Extract tokens from auth response bodies (login, magic-token, etc.)
      if (data.access) access = data.access;
      if (data.refresh) refresh = data.refresh;
      if (data.data?.access) access = data.data.access;
      if (data.data?.refresh) refresh = data.data.refresh;

      const nextRes = NextResponse.json(data, { status: response.status });
      setAuthCookies(nextRes, access, refresh);

      if (path.includes("auth/logout")) {
        nextRes.cookies.set("webapp_access_token", "", { maxAge: 0, path: "/" });
        nextRes.cookies.set("webapp_refresh_token", "", { maxAge: 0, path: "/" });
      }

      return nextRes;
    } else {
      const blob = await response.blob();
      const nextRes = new NextResponse(blob, {
        status: response.status,
        headers: {
          "Content-Type": resContentType || "application/octet-stream",
        },
      });
      setAuthCookies(nextRes, refreshedAccess, refreshedRefresh);
      return nextRes;
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Server connection issue. Please try again later.", detail: "An error occurred while connecting to the service." },
      { status: 502 }
    );
  }
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
