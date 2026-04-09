// Staff login page has no wrapper — it's standalone outside the guarded staff layout
export default function StaffLoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
