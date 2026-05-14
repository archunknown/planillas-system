import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { registerFonts } from '@/lib/pdf/fonts';
import { styles, formatAmount } from '@/lib/pdf/styles';

registerFonts();

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export type BoletaPagoData = {
  detalle: {
    id: string;
    diasTrabajados: number;
    diasNoTrabajados: number;
    faltas: number;
    feriados: number;
    remuneracionBasica: number;
    horasExtrasTotal: number;
    asignacionFamiliar: number;
    bonificacionCC: number;
    movilidadCC: number;
    bonificacionAltura: number;
    asignacionEscolar: number;
    otrosIngresos: number;
    totalIngresos: number;
    descuentoOnp: number;
    descuentoAfp: number;
    comisionAfp: number;
    primaSeguroAfp: number;
    retencionQuinta: number;
    otrosDescuentos: number;
    totalDescuentos: number;
    essalud: number;
    sctr: number;
    netoPagar: number;
    periodo: {
      mes: number;
      anio: number;
      empresa: {
        razonSocial: string;
        ruc: string;
        direccion: string;
        distrito: string;
      };
    };
    contrato: {
      cargo: string;
      regimenLaboral: string;
      sistemaPensionario: string;
      fechaInicio: Date;
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

type ConceptoRow = { label: string; amount: number };

function buildConceptos(d: BoletaPagoData['detalle']) {
  const ingresos: ConceptoRow[] = [
    { label: 'Remuneracion basica', amount: d.remuneracionBasica },
    { label: 'Asignacion familiar', amount: d.asignacionFamiliar },
    { label: 'Horas extras', amount: d.horasExtrasTotal },
    { label: 'Bonif. construccion civil', amount: d.bonificacionCC },
    { label: 'Movilidad CC', amount: d.movilidadCC },
    { label: 'Bonif. altura/zona', amount: d.bonificacionAltura },
    { label: 'Asignacion escolar', amount: d.asignacionEscolar },
    { label: 'Otros ingresos', amount: d.otrosIngresos },
  ].filter((c) => c.amount > 0);

  const descuentos: ConceptoRow[] = [
    { label: 'ONP', amount: d.descuentoOnp },
    { label: 'AFP (aporte)', amount: d.descuentoAfp },
    { label: 'AFP (comision)', amount: d.comisionAfp },
    { label: 'AFP (prima seguro)', amount: d.primaSeguroAfp },
    { label: 'Ret. 5ta categoria', amount: d.retencionQuinta },
    { label: 'Otros descuentos', amount: d.otrosDescuentos },
  ].filter((c) => c.amount > 0);

  return { ingresos, descuentos };
}

function ConceptoTable({
  titulo,
  filas,
  total,
}: {
  titulo: string;
  filas: ConceptoRow[];
  total: number;
}) {
  return (
    <View style={styles.tableCol}>
      <View style={styles.tableHeader}>
        <Text style={styles.tableHeaderText}>{titulo}</Text>
        <Text style={styles.tableHeaderAmount}>S/</Text>
      </View>
      {filas.map((f, i) => (
        <View key={i} style={styles.tableRow}>
          <Text style={styles.tableRowText}>{f.label}</Text>
          <Text style={styles.tableRowAmount}>{f.amount.toFixed(2)}</Text>
        </View>
      ))}
      <View style={styles.tableTotalRow}>
        <Text style={styles.tableTotalText}>TOTAL</Text>
        <Text style={styles.tableTotalAmount}>{total.toFixed(2)}</Text>
      </View>
    </View>
  );
}

export function BoletaPagoPDF({ detalle: d, fechaEmision }: BoletaPagoData) {
  const { ingresos, descuentos } = buildConceptos(d);
  const mesNombre = MESES[d.periodo.mes - 1];
  const empresa = d.periodo.empresa;
  const trabajador = d.contrato.trabajador;
  const nombreCompleto = `${trabajador.apellidoPaterno} ${trabajador.apellidoMaterno}, ${trabajador.nombres}`;
  const fechaInicioStr = new Date(d.contrato.fechaInicio).toLocaleDateString('es-PE');
  const fechaEmisionStr = fechaEmision.toLocaleDateString('es-PE');

  const aportesEmpleador: ConceptoRow[] = [
    { label: 'EsSalud (9%)', amount: d.essalud },
    { label: 'SCTR', amount: d.sctr },
  ].filter((c) => c.amount > 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
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
            <Text style={styles.titulo}>BOLETA DE PAGO</Text>
            <Text style={styles.body}>
              {mesNombre} {d.periodo.anio}
            </Text>
          </View>
        </View>

        {/* Datos del trabajador */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Datos del Trabajador</Text>
          <View style={styles.row}>
            <Text style={styles.label}>DNI:</Text>
            <Text style={styles.value}>{trabajador.dni}</Text>
            <Text style={styles.label}>Cargo:</Text>
            <Text style={styles.value}>{d.contrato.cargo}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Apellidos y nombres:</Text>
            <Text style={styles.value}>{nombreCompleto}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Regimen:</Text>
            <Text style={styles.value}>
              {d.contrato.regimenLaboral.replace(/_/g, ' ')}
            </Text>
            <Text style={styles.label}>Sistema pensionario:</Text>
            <Text style={styles.value}>{d.contrato.sistemaPensionario}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Fecha inicio:</Text>
            <Text style={styles.value}>{fechaInicioStr}</Text>
            <Text style={styles.label}>Dias trabajados:</Text>
            <Text style={styles.value}>{d.diasTrabajados}</Text>
          </View>
        </View>

        {/* Tabla de conceptos */}
        <View style={styles.tableContainer}>
          <ConceptoTable titulo="INGRESOS" filas={ingresos} total={d.totalIngresos} />
          <ConceptoTable titulo="DESCUENTOS" filas={descuentos} total={d.totalDescuentos} />
        </View>

        {/* Neto a pagar */}
        <View style={styles.netoContainer}>
          <Text style={styles.netoLabel}>NETO A PAGAR</Text>
          <Text style={styles.netoAmount}>{formatAmount(d.netoPagar)}</Text>
        </View>

        {/* Aportes empleador */}
        {aportesEmpleador.length > 0 && (
          <View style={styles.aportesContainer}>
            <Text style={styles.seccionTitulo}>Aportes Empleador (no descontados al trabajador)</Text>
            {aportesEmpleador.map((a, i) => (
              <View key={i} style={styles.row}>
                <Text style={styles.label}>{a.label}:</Text>
                <Text style={styles.value}>{formatAmount(a.amount)}</Text>
              </View>
            ))}
          </View>
        )}

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
          Recibo conforme la cantidad mencionada — Fecha de emision: {fechaEmisionStr}
        </Text>
      </Page>
    </Document>
  );
}
