import { requireRole } from '@/lib/auth/guards';
import { EmpresaForm } from '@/components/empresas/empresa-form';

export default async function NuevaEmpresaPage() {
  await requireRole(['ADMIN']);
  return (
    <div className="p-6 max-w-2xl">
      <h1 className="mb-6 text-xl font-semibold">Nueva empresa</h1>
      <EmpresaForm modo="crear" />
    </div>
  );
}
