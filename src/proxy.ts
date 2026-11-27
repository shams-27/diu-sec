export { auth as proxy } from "@/backend/shared/auth";

export const config = {
  matcher: ["/admin/:path*"],
};
