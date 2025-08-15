import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { roleHasPermission } from './rbac/server';
import { usersInterface } from './drizzle/schema';

/**
 * Simple middleware: only allow authenticated users to access /p and its children.
 * Unauthenticated users are redirected to the admin login page.
 */
export async function middleware(req: NextRequest) {
	const { pathname } = req.nextUrl;

	// Only enforce auth for /p routes.
	if (pathname === '/p' || pathname.startsWith('/p/')) {
		const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

		const id = token?.sub;
		if (id && !id!.includes('-')) {
			return NextResponse.redirect(new URL('/login', req.url));
		}

		if (!token) {
			// redirect to the app's login page
			const loginUrl = new URL('/login', req.url);
			loginUrl.searchParams.set('from', pathname);
			return NextResponse.redirect(loginUrl);
		}

		if (pathname.startsWith('/p/admin') || pathname === '/p/settings') {
			const role = (token.user as usersInterface)?.usertype ?? null;
			const allowed = roleHasPermission(role, 'admin.access');
			if (!allowed) {
				return new NextResponse('Access denied', { status: 403 });
			}
		}
	}

	if (pathname === '/login') {
		const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
		if (token) {
			return NextResponse.redirect(new URL('/p/dashboard', req.url));
		}
	}


	return NextResponse.next();
}

export const config = {
	matcher: ['/p/:path*', '/p', '/login'],
};

