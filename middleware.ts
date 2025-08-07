import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here if needed
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // For demo purposes, allow access to most routes
        // In production, you'd implement proper role-based access control
        const { pathname } = req.nextUrl;
        
        // Always allow access to login page
        if (pathname.startsWith('/admin/login')) {
          return true;
        }
        
        // For other admin routes, require authentication
        if (pathname.startsWith('/admin')) {
          return !!token;
        }
        
        return true;
      },
    },
  }
)

export const config = {
  matcher: ['/admin/:path*']
}
