import { notFound } from 'next/navigation';
import * as trabajadorService from '@/lib/services/trabajador.service';
import { getSession } from '@/lib/auth/dal';
import { ServiceError } from '@/lib/errors/service-error';
import { TrabajadorForm } from '@/components/trabajadores/trabajador-form';
import { EliminarTrabajadorDialog } from '@/components/trabajadores/eliminar-trabajador-dialog';
import { HijosSection } from '@/components/hijos/hijos-section';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';

export default async function EditarTrabajadorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let trabajador;
  let hijos;
  try {
    [trabajador, hijos] = await Promise.all([
      trabajadorService.obtenerPorId(id),
      trabajadorService.listarHijos(id, { incluirEliminados: false }),
    ]);
  } catch (err) {
    if (err instanceof ServiceError && err.code === 'NOT_FOUND') notFound();
    throw err;
  }

  const session = await getSession();
  const rol = session?.user?.rol;
  const canEdit = rol === 'ADMIN' || rol === 'CONTADOR';

  const nombresCompletos = `${trabajador.apellidoPaterno} ${trabajador.apellidoMaterno}, ${trabajador.nombres}`;

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{nombresCompletos}</h1>
        {canEdit && !trabajador.eliminadoEn && (
          <EliminarTrabajadorDialog
            trabajadorId={trabajador.id}
            nombres={nombresCompletos}
          />
        )}
      </div>

      <Tabs defaultValue="datos">
        <TabsList>
          <TabsTrigger value="datos">Datos</TabsTrigger>
          <TabsTrigger value="hijos">Hijos ({hijos.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="datos" className="pt-4">
          <TrabajadorForm modo="editar" trabajador={trabajador} canEdit={canEdit} />
        </TabsContent>

        <TabsContent value="hijos" className="pt-4">
          <HijosSection
            trabajadorId={trabajador.id}
            hijos={hijos}
            canEdit={canEdit && !trabajador.eliminadoEn}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
