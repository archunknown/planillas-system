import { requireSession } from '@/lib/auth/guards';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireSession();
  return <>{children}</>;
}
