import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { registerFonts } from '@/lib/pdf/fonts';
import { styles, formatAmount } from '@/lib/pdf/styles';

registerFonts();

export type BoletaLiquidacionData = {
  liquidacion: {
    id: string;
    fechaCese: Date;
    fechaCalculo: Date;
    ctsTruncaMeses: number;
    ctsTruncaDias: number;
    ctsTrunca: number;
    gratificacionTruncaMeses: number;
    gratificacionTruncaDias: number;
    gratificacionTrunca: number;
    vacacionesTruncaMeses: number;
    vacacionesTruncaDias: number;
    vacacionesTruncas: number;
    remuneracionPendiente: number;
    totalBruto: number;
    descuentos: number;
    totalNeto: number;
    anulada: boolean;
    anuladaEn: Date | null;
    motivoAnulacion: string | null;
    contrato: {
      cargo: string;
      regimenLaboral: string;
      sistemaPensionario: string;
      fechaInicio: Date;
      fechaFin: Date | null;
      motivoCese: string | null;
      empresaId: string;
      empresa: {
        razonSocial: string;
        ruc: string;
        direccion: string;
        distrito: string;
      };
      trabajador: {
        dni: string;
        apellidoPaterno: string;
        apellidoMaterno: string;
        nombres: string;
      };
    };
  };
  fechaEmision: Date;
};

type ConceptoRow = { label: string; amount: number; sublabel?: string };

function buildConceptos(liq: BoletaLiquidacionData['liquidacion']): ConceptoRow[] {
  const rows: ConceptoRow[] = [
    {
      label: 'CTS trunca',
      sublabel: `${liq.ctsTruncaMeses} mes(es) + ${liq.ctsTruncaDias} dia(s)`,
      amount: liq.ctsTrunca,
    },
    {
      label: 'Gratificacion trunca',
      sublabel: `${liq.gratificacionTruncaMeses} mes(es) + ${liq.gratificacionTruncaDias} dia(s)`,
      amount: liq.gratificacionTrunca,
    },
    {
      label: 'Vacaciones truncas',
      sublabel: `${liq.vacacionesTruncaMeses} mes(es) + ${liq.vacacionesTruncaDias} dia(s)`,
      amount: liq.vacacionesTruncas,
    },
  ];

  if (liq.remuneracionPendiente > 0) {
    rows.push({ label: 'Remuneracion pendiente', amount: liq.remuneracionPendiente });
  }

  return rows;
}

export function BoletaLiquidacionPDF({ liquidacion: liq, fechaEmision }: BoletaLiquidacionData) {
  const trabajador = liq.contrato.trabajador;
  const empresa = liq.contrato.empresa;
  const nombreCompleto = `${trabajador.apellidoPaterno} ${trabajador.apellidoMaterno}, ${trabajador.nombres}`;
  const fechaCeseStr = new Date(liq.fechaCese).toLocaleDateString('es-PE');
  const fechaInicioStr = new Date(liq.contrato.fechaInicio).toLocaleDateString('es-PE');
  const fechaFinStr = liq.contrato.fechaFin
    ? new Date(liq.contrato.fechaFin).toLocaleDateString('es-PE')
    : fechaCeseStr;
  const fechaEmisionStr = fechaEmision.toLocaleDateString('es-PE');
  const conceptos = buildConceptos(liq);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Banner de anulación */}
        {liq.anulada && (
          <View
            style={{
              backgroundColor: '#fee2e2',
              borderWidth: 1,
              borderColor: '#ef4444',
              padding: 8,
              marginBottom: 10,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#b91c1c', textAlign: 'center' }}>
              LIQUIDACION ANULADA
            </Text>
            {liq.anuladaEn && (
              <Text style={{ fontSize: 8, color: '#b91c1c', textAlign: 'center', marginTop: 2 }}>
                Anulada el {new Date(liq.anuladaEn).toLocaleDateString('es-PE')}
              </Text>
            )}
            {liq.motivoAnulacion && (
              <Text style={{ fontSize: 8, color: '#7f1d1d', textAlign: 'center', marginTop: 2 }}>
                Motivo: {liq.motivoAnulacion}
              </Text>
            )}
          </View>
        )}

        {/* Encabezado */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.subtitulo}>{empresa.razonSocial}</Text>
            <Text style={styles.body}>RUC: {empresa.ruc}</Text>
            <Text style={styles.body}>
              {empresa.direccion}, {empresa.distrito}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.titulo}>LIQUIDACION DE</Text>
            <Text style={styles.titulo}>BENEFICIOS SOCIALES</Text>
            <Text style={styles.body}>Fecha de cese: {fechaCeseStr}</Text>
          </View>
        </View>

        {/* Datos del trabajador */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Datos del Trabajador</Text>
          <View style={styles.row}>
            <Text style={styles.label}>DNI:</Text>
            <Text style={styles.value}>{trabajador.dni}</Text>
            <Text style={styles.label}>Cargo:</Text>
            <Text style={styles.value}>{liq.contrato.cargo}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Apellidos y nombres:</Text>
            <Text style={styles.value}>{nombreCompleto}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Regimen:</Text>
            <Text style={styles.value}>
              {liq.contrato.regimenLaboral.replace(/_/g, ' ')}
            </Text>
            <Text style={styles.label}>Sist. pensionario:</Text>
            <Text style={styles.value}>{liq.contrato.sistemaPensionario}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Fecha inicio:</Text>
            <Text style={styles.value}>{fechaInicioStr}</Text>
            <Text style={styles.label}>Fecha fin:</Text>
            <Text style={styles.value}>{fechaFinStr}</Text>
          </View>
          {liq.contrato.motivoCese && (
            <View style={styles.row}>
              <Text style={styles.label}>Motivo de cese:</Text>
              <Text style={styles.value}>{liq.contrato.motivoCese}</Text>
            </View>
          )}
        </View>

        {/* Tabla de conceptos */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Conceptos de Liquidacion</Text>
          <View style={styles.tableCol}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>Concepto</Text>
              <Text style={styles.tableHeaderAmount}>S/</Text>
            </View>
            {conceptos.map((c, i) => (
              <View key={i} style={styles.tableRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tableRowText}>{c.label}</Text>
                  {c.sublabel && (
                    <Text style={[styles.small, { marginTop: 1 }]}>{c.sublabel}</Text>
                  )}
                </View>
                <Text style={styles.tableRowAmount}>{c.amount.toFixed(2)}</Text>
              </View>
            ))}
            <View style={styles.tableTotalRow}>
              <Text style={styles.tableTotalText}>SUBTOTAL BRUTO</Text>
              <Text style={styles.tableTotalAmount}>{liq.totalBruto.toFixed(2)}</Text>
            </View>
            {liq.descuentos > 0 && (
              <View style={styles.tableRow}>
                <Text style={styles.tableRowText}>Descuentos</Text>
                <Text style={styles.tableRowAmount}>({liq.descuentos.toFixed(2)})</Text>
              </View>
            )}
          </View>
        </View>

        {/* Total neto */}
        <View style={styles.netoContainer}>
          <Text style={styles.netoLabel}>TOTAL NETO A PAGAR</Text>
          <Text style={styles.netoAmount}>{formatAmount(liq.totalNeto)}</Text>
        </View>

        {/* Firma */}
        <View style={styles.firmaContainer}>
          <View style={styles.firmaCol}>
            <View style={styles.firmaLinea} />
            <Text style={styles.firmaLabel}>EMPLEADOR</Text>
          </View>
          <View style={styles.firmaCol}>
            <View style={styles.firmaLinea} />
            <Text style={styles.firmaLabel}>TRABAJADOR</Text>
          </View>
        </View>
        <Text style={styles.firmaTexto}>
          Recibo conforme la cantidad mencionada como pago total e integro de mis beneficios
          sociales al cese — Fecha de emision: {fechaEmisionStr}
        </Text>
      </Page>
    </Document>
  );
}
