import { AdminSubNav } from "@/components/admin/AdminSubNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminSubNav />
      {children}
    </>
  );
}
