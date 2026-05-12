import { requireRole } from '@/lib/auth/guards';
import { AbrirPeriodoForm } from '@/components/planilla/abrir-periodo-form';
import { redirect } from 'next/navigation';

interface Props {
  searchParams: Promise<{ empresaId?: string }>;
}

export default async function NuevoPeriodoPage({ searchParams }: Props) {
  await requireRole(['ADMIN', 'CONTADOR']);
  const { empresaId } = await searchParams;

  if (!empresaId) redirect('/planilla');

  return (
    <div className="p-6 max-w-lg">
      <h1 className="mb-6 text-xl font-semibold">Nuevo período</h1>
      <AbrirPeriodoForm empresaId={empresaId} />
    </div>
  );
}
