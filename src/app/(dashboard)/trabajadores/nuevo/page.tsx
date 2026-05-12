import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth/guards';
import { TrabajadorForm } from '@/components/trabajadores/trabajador-form';

interface Props {
  searchParams: Promise<{ empresaId?: string }>;
}

export default async function NuevoTrabajadorPage({ searchParams }: Props) {
  await requireRole(['ADMIN', 'CONTADOR']);
  const { empresaId } = await searchParams;
  if (!empresaId) notFound();

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="mb-6 text-xl font-semibold">Nuevo trabajador</h1>
      <TrabajadorForm modo="crear" empresaId={empresaId} />
    </div>
  );
}
