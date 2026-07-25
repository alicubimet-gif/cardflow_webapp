export const dynamic = 'force-dynamic';
import { NextRequest } from "next/server";
import { GET as serverGET, POST as serverPOST, PUT as serverPUT, PATCH as serverPATCH, DELETE as serverDELETE } from "@/app/server/[...path]/route";

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return serverGET(request, context);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return serverPOST(request, context);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return serverPUT(request, context);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return serverPATCH(request, context);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return serverDELETE(request, context);
}
