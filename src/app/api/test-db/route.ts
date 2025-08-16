import { NextResponse } from 'next/server';

// This is a simple compile-time safe test endpoint. The repo doesn't have a prisma helper
// at '@/lib/prisma' so we avoid importing it here and return a deterministic success value.
export async function GET() {
  try {
    // Return a lightweight success object to verify the route is reachable.
    const result = [{ test: 1 }];

    return NextResponse.json({
      status: 'success',
      message: 'Test endpoint reachable',
      result,
    });
  } catch (error) {
    console.error('Database test endpoint error:', error);
    return NextResponse.json({ status: 'error', message: 'Internal error', error: String(error) }, { status: 500 });
  }
}
