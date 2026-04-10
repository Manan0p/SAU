import { redirect } from "next/navigation";

/** Root "/" redirects to /dashboard.
 *  AuthGuard on /dashboard will push to /login if not authenticated. */
export default function HomePage() {
  redirect("/student/dashboard");
}
