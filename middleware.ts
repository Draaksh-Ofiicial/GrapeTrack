import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here if needed
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Always allow access to login page and API routes
        if (
          pathname.startsWith('/admin/login') || 
          pathname.startsWith('/api/') ||
          pathname.startsWith('/_next/') ||
          pathname === '/favicon.ico'
        ) {
          return true;
        }
        
        // For other admin routes, require authentication
        if (pathname.startsWith('/admin')) {
          return !!token;
        }
        
        // Allow all other routes
        return true;
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes that should handle auth themselves)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ]
}
