export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || "https://cubixmet.pythonanywhere.com/api";

async function handleRequest(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  let path = resolvedParams.path.join("/");
  if (path.startsWith("api/")) {
    path = path.substring(4);
  }
  const url = new URL(request.url);
  const searchParams = url.searchParams.toString();

  let base = BACKEND_API_URL.replace(/\/$/, "");
  if (!base.endsWith("/api")) {
    base = `${base}/api`;
  }
  const cleanPath = path.replace(/^\//, "").replace(/\/$/, "");
  const backendUrl = `${base}/${cleanPath}/${searchParams ? "?" + searchParams : ""}`;

  const isAuthEndpoint = path.includes('auth/login') ||
    path.includes('auth/refresh') ||
    path.includes('auth/logout') ||
    path.includes('auth/google-login') ||
    path.includes('auth/verify-magic-token') ||
    path.includes('auth/complete-password-setup') ||
    path.includes('auth/forgot-password') ||
    path.includes('auth/reset-password');

  console.log(`[WebApp Proxy] ${request.method} /server/${path} → ${backendUrl}`);
  
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers.set("content-type", contentType);
  }
  
  if (!isAuthEndpoint) {
    const token = request.cookies.get("webapp_access_token")?.value;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  let body = null;
  if (request.method !== "GET" && request.method !== "HEAD") {
    if (contentType && contentType.includes("multipart/form-data")) {
      body = await request.formData();
      headers.delete("content-type");
    } else if (path.includes("auth/logout")) {
      const refreshToken = request.cookies.get("webapp_refresh_token")?.value;
      body = JSON.stringify({ refresh: refreshToken || "" });
    } else {
      const text = await request.text();
      body = text ? text : null;
    }
  }

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



    if (response.status === 401 && !isAuthEndpoint) {
      const refreshToken = request.cookies.get('webapp_refresh_token')?.value;
      if (refreshToken) {
        try {
          const refreshRes = await fetch(`${base}/auth/refresh/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh: refreshToken }),
            cache: 'no-store',
          });

          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            const newAccess = refreshData.access || refreshData.data?.access;
            const newRefresh = refreshData.refresh || refreshData.data?.refresh;

            if (newAccess) {
              refreshedAccess = newAccess;
              if (newRefresh) refreshedRefresh = newRefresh;

              headers.set('Authorization', `Bearer ${newAccess}`);
              response = await fetch(backendUrl, {
                method: request.method,
                headers,
                body,
                redirect: 'manual',
                cache: 'no-store',
              });
            }
          } else {
            const nextRes = NextResponse.json(
              { success: false, message: 'Session expired. Please sign in again.' },
              { status: 401 }
            );
            nextRes.cookies.set('webapp_access_token', '', { maxAge: 0, path: '/' });
            nextRes.cookies.set('webapp_refresh_token', '', { maxAge: 0, path: '/' });
            return nextRes;
          }
        } catch (refreshErr) {
          // ignore
        }
      }
    }

    const isHttps = request.nextUrl.protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";

    const cookieOptions = {
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax" as const,
      path: "/",
      ...(process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {}),
    };

    const setAuthCookies = (resObj: NextResponse, access: string | null, refresh: string | null) => {
      if (access) {
        resObj.cookies.set("webapp_access_token", access, {
          ...cookieOptions,
          maxAge: 60 * 15, // 15 mins
        });
      }
      if (refresh) {
        resObj.cookies.set("webapp_refresh_token", refresh, {
          ...cookieOptions,
          maxAge: 60 * 60 * 24 * 7, // 7 days
        });
      }
    };

    if (response.status === 204 || response.status === 205) {
      const nextRes = new NextResponse(null, {
        status: response.status,
      });
      setAuthCookies(nextRes, refreshedAccess, refreshedRefresh);
      return nextRes;
    }

    const resContentType = response.headers.get("content-type");
    if (resContentType && resContentType.includes("application/json")) {
      const data = await response.json();
      
      let access = refreshedAccess;
      let refresh = refreshedRefresh;
      
      if (data.access) access = data.access;
      if (data.refresh) refresh = data.refresh;
      if (data.data?.access) access = data.data.access;
      if (data.data?.refresh) refresh = data.data.refresh;

      const nextRes = NextResponse.json(data, { status: response.status });
      
      setAuthCookies(nextRes, access, refresh);
      
      if (path.includes("auth/logout")) {
        nextRes.cookies.set('webapp_access_token', '', { maxAge: 0, path: '/' });
        nextRes.cookies.set('webapp_refresh_token', '', { maxAge: 0, path: '/' });
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
    console.error(`[WebApp Proxy Error] ${request.method} /${path}:`, error.message);
    return NextResponse.json(
      { success: false, message: "Internal Proxy Error", detail: error.message },
      { status: 500 }
    );
  }
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
