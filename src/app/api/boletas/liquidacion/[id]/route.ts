import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { requireSession, requireOwnership } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';
import { BoletaLiquidacionPDF } from '@/components/pdf/BoletaLiquidacionPDF';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireSession();

  const { id } = await params;

  const liq = await prisma.liquidacion.findUnique({
    where: { id },
    include: {
      contrato: {
        select: {
          empresaId: true,
          cargo: true,
          regimenLaboral: true,
          sistemaPensionario: true,
          fechaInicio: true,
          fechaFin: true,
          motivoCese: true,
          empresa: {
            select: { razonSocial: true, ruc: true, direccion: true, distrito: true },
          },
          trabajador: {
            select: { dni: true, apellidoPaterno: true, apellidoMaterno: true, nombres: true },
          },
        },
      },
    },
  });

  if (!liq) {
    return Response.json({ error: 'Liquidacion no encontrada' }, { status: 404 });
  }

  await requireOwnership(liq.contrato.empresaId);

  const data = {
    liquidacion: {
      id: liq.id,
      fechaCese: liq.fechaCese,
      fechaCalculo: liq.fechaCalculo,
      ctsTruncaMeses: liq.ctsTruncaMeses,
      ctsTruncaDias: liq.ctsTruncaDias,
      ctsTrunca: liq.ctsTrunca.toNumber(),
      gratificacionTruncaMeses: liq.gratificacionTruncaMeses,
      gratificacionTruncaDias: liq.gratificacionTruncaDias,
      gratificacionTrunca: liq.gratificacionTrunca.toNumber(),
      vacacionesTruncaMeses: liq.vacacionesTruncaMeses,
      vacacionesTruncaDias: liq.vacacionesTruncaDias,
      vacacionesTruncas: liq.vacacionesTruncas.toNumber(),
      remuneracionPendiente: liq.remuneracionPendiente.toNumber(),
      totalBruto: liq.totalBruto.toNumber(),
      descuentos: liq.descuentos.toNumber(),
      totalNeto: liq.totalNeto.toNumber(),
      anulada: liq.anulada,
      anuladaEn: liq.anuladaEn,
      motivoAnulacion: liq.motivoAnulacion,
      contrato: liq.contrato,
    },
    fechaEmision: new Date(),
  };

  const buffer = await renderToBuffer(
    React.createElement(BoletaLiquidacionPDF, data) as never,
  );

  const fechaCese = new Date(liq.fechaCese);
  const yyyy = fechaCese.getUTCFullYear();
  const mm = String(fechaCese.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(fechaCese.getUTCDate()).padStart(2, '0');
  const filename = `liquidacion-${liq.contrato.trabajador.dni}-${yyyy}${mm}${dd}.pdf`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
