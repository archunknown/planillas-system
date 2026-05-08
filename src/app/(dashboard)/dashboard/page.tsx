import { getSession } from '@/lib/auth/dal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, FileText, BadgeDollarSign } from 'lucide-react';
import * as empresaService from '@/lib/services/empresa.service';
import * as trabajadorService from '@/lib/services/trabajador.service';
import * as contratoService from '@/lib/services/contrato.service';
import * as liquidacionService from '@/lib/services/liquidacion.service';

interface Props {
  searchParams: Promise<{ empresaId?: string }>;
}

export default async function DashboardPage({ searchParams }: Props) {
  const [session, sp] = await Promise.all([getSession(), searchParams]);
  const user = session!.user;
  const empresaId = sp.empresaId;

  const now = new Date();
  const primerDiaMes = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const ultimoDiaMes = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));

  type Rol = 'ADMIN' | 'CONTADOR' | 'CLIENTE';
  const rol = user.rol as Rol;

  // Empresa count
  const empresaCount = rol === 'ADMIN'
    ? (await empresaService.listar()).total
    : (user.empresasIds as string[]).length;

  // Per-empresa counts (only if we have an active empresa)
  let trabajadoresActivos = 0;
  let contratosActivos = 0;
  let liquidacionesMes = 0;

  if (empresaId) {
    const [tw, ct, liq] = await Promise.all([
      trabajadorService.listarPorEmpresa(empresaId),
      contratoService.listarPorEmpresa(empresaId, { incluirEliminados: false, soloActivos: true, pagina: 1, porPagina: 1 }),
      liquidacionService.listarPorEmpresa(empresaId, {
        incluirAnuladas: false,
        fechaCeseDesde: primerDiaMes,
        fechaCeseHasta: ultimoDiaMes,
        pagina: 1,
        porPagina: 1,
      }),
    ]);
    trabajadoresActivos = tw.total;
    contratosActivos = ct.total;
    liquidacionesMes = liq.total;
  }

  const cards = [
    {
      title: rol === 'ADMIN' ? 'Empresas registradas' : 'Mis empresas',
      value: empresaCount,
      icon: <Building2 className="size-4 text-muted-foreground" />,
      show: true,
    },
    {
      title: 'Trabajadores activos',
      value: trabajadoresActivos,
      icon: <Users className="size-4 text-muted-foreground" />,
      show: !!empresaId,
    },
    {
      title: 'Contratos vigentes',
      value: contratosActivos,
      icon: <FileText className="size-4 text-muted-foreground" />,
      show: !!empresaId,
    },
    {
      title: 'Liquidaciones del mes',
      value: liquidacionesMes,
      icon: <BadgeDollarSign className="size-4 text-muted-foreground" />,
      show: !!empresaId,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Inicio</h1>
        {!empresaId && (
          <p className="mt-1 text-sm text-muted-foreground">
            Selecciona una empresa en el menú lateral para ver los detalles.
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.filter((c) => c.show).map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              {card.icon}
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
