// Admin login page has no wrapper — it's a standalone page outside the guarded admin layout
export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
