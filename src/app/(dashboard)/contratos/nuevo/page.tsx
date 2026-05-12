import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth/guards';
import * as trabajadorService from '@/lib/services/trabajador.service';
import { ContratoForm } from '@/components/contratos/contrato-form';

interface Props {
  searchParams: Promise<{ empresaId?: string; trabajadorId?: string }>;
}

export default async function NuevoContratoPage({ searchParams }: Props) {
  await requireRole(['ADMIN', 'CONTADOR']);
  const { empresaId, trabajadorId } = await searchParams;
  if (!empresaId) notFound();

  const { datos: trabajadores } = await trabajadorService.listarPorEmpresa(empresaId, {
    incluirEliminados: false,
  });

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="mb-6 text-xl font-semibold">Nuevo contrato</h1>
      <ContratoForm
        modo="crear"
        empresaId={empresaId}
        trabajadorIdDefault={trabajadorId}
        trabajadores={trabajadores}
      />
    </div>
  );
}
