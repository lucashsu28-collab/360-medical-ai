/**
 * Returns the correct portal auth token.
 * In admin bypass mode (sessionStorage.admin_bypass_token = "authenticated"),
 * returns the admin bypass token instead of the clinic's JWT.
 */
export function getPortalToken(): string {
  if (typeof window === "undefined") return "";
  const bypass = sessionStorage.getItem("admin_bypass_token");
  if (bypass === "authenticated") return bypass;
  return localStorage.getItem("portal_token") || "";
}
