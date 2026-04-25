const round2 = (value: number): number => Math.round(value * 100) / 100;

export interface TramoQuinta {
  tasa: number;
  limite: number;
}

export interface QuintaCategoriaInput {
  remuneracionMensual: number;
  gratificacionesAnuales: number;
  mesActual: number;
  retencionesAnteriores: number;
  uit: number;
  tramos?: TramoQuinta[];
}

export interface QuintaCategoriaResult {
  rentaAnualProyectada: number;
  deduccion7UIT: number;
  rentaImponible: number;
  impuestoAnual: number;
  retencionMensual: number;
}

function calcularImpuestoProgresivo(rentaImponible: number, uit: number, tramosOverride?: TramoQuinta[]): number {
  const tramos = tramosOverride ?? [
    { limite: 5 * uit, tasa: 0.08 },
    { limite: 20 * uit, tasa: 0.14 },
    { limite: 35 * uit, tasa: 0.17 },
    { limite: 45 * uit, tasa: 0.20 },
    { limite: Infinity, tasa: 0.30 },
  ];

  let impuesto = 0;
  let base = rentaImponible;
  let limiteAnterior = 0;

  for (const tramo of tramos) {
    if (base <= 0) break;
    const tramo_ancho = tramo.limite - limiteAnterior;
    const gravado = Math.min(base, tramo_ancho);
    impuesto += gravado * tramo.tasa;
    base -= gravado;
    limiteAnterior = tramo.limite;
  }

  return round2(impuesto);
}

export function calcularRetencionQuinta(
  input: QuintaCategoriaInput
): QuintaCategoriaResult {
  const { remuneracionMensual, gratificacionesAnuales, mesActual, retencionesAnteriores, uit, tramos } = input;

  const rentaAnualProyectada = round2(remuneracionMensual * 12 + gratificacionesAnuales);
  const deduccion7UIT = round2(7 * uit);
  const rentaImponible = Math.max(0, round2(rentaAnualProyectada - deduccion7UIT));

  if (rentaImponible === 0) {
    return { rentaAnualProyectada, deduccion7UIT, rentaImponible, impuestoAnual: 0, retencionMensual: 0 };
  }

  const impuestoAnual = calcularImpuestoProgresivo(rentaImponible, uit, tramos);
  const mesesRestantes = 12 - mesActual + 1;
  const retencionMensual = Math.max(0, round2(impuestoAnual / mesesRestantes - retencionesAnteriores));

  return { rentaAnualProyectada, deduccion7UIT, rentaImponible, impuestoAnual, retencionMensual };
}
