import { NextResponse } from "next/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  // Simple health check without database dependency
  return NextResponse.json(
    {
      ok: true,
      message: "Backend is running",
      timestamp: new Date().toISOString(),
    },
    { headers: corsHeaders }
  );
}
