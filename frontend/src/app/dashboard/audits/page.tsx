import { redirect } from "next/navigation"

/** Audit Lab lives on /dashboard; keep this route for bookmarks and header titles. */
export default function AuditsPage() {
  redirect("/dashboard")
}
