// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { PDFParse } from 'pdf-parse';
import { BoletaLiquidacionPDF } from '@/components/pdf/BoletaLiquidacionPDF';
import type { BoletaLiquidacionData } from '@/components/pdf/BoletaLiquidacionPDF';

// pdf-parse v2 API: new PDFParse({ data: buffer }).getText()
// Non-ASCII text extraction (tildes, ñ) unreliable due to ToUnicode CMap limitations.
// Assertions use ASCII-safe fields: RUC, DNI, numeric amounts.

const FIXTURE: BoletaLiquidacionData = {
  liquidacion: {
    id: 'liq1',
    fechaCese: new Date('2025-03-31'),
    fechaCalculo: new Date('2025-04-01'),
    ctsTruncaMeses: 2,
    ctsTruncaDias: 15,
    ctsTrunca: 500.00,
    gratificacionTruncaMeses: 2,
    gratificacionTruncaDias: 15,
    gratificacionTrunca: 333.33,
    vacacionesTruncaMeses: 2,
    vacacionesTruncaDias: 15,
    vacacionesTruncas: 166.67,
    remuneracionPendiente: 0,
    totalBruto: 1000.00,
    descuentos: 130.00,
    totalNeto: 870.00,
    anulada: false,
    anuladaEn: null,
    motivoAnulacion: null,
    contrato: {
      cargo: 'Analista',
      regimenLaboral: 'REGIMEN_GENERAL',
      sistemaPensionario: 'ONP',
      fechaInicio: new Date('2023-01-01'),
      fechaFin: null,
      motivoCese: null,
      empresaId: 'emp1',
      empresa: {
        razonSocial: 'EMPRESA DEMO SRL',
        ruc: '20999888777',
        direccion: 'Av. Principal 123',
        distrito: 'Lima',
      },
      trabajador: {
        dni: '12345678',
        apellidoPaterno: 'Garcia',
        apellidoMaterno: 'Lopez',
        nombres: 'Juan Carlos',
      },
    },
  },
  fechaEmision: new Date('2025-04-01'),
};

const FIXTURE_ANULADA: BoletaLiquidacionData = {
  ...FIXTURE,
  liquidacion: {
    ...FIXTURE.liquidacion,
    anulada: true,
    anuladaEn: new Date('2025-04-10'),
    motivoAnulacion: 'Error de calculo',
  },
};

let buffer: Buffer;
let bufferAnulada: Buffer;

beforeAll(async () => {
  [buffer, bufferAnulada] = await Promise.all([
    renderToBuffer(React.createElement(BoletaLiquidacionPDF, FIXTURE) as never),
    renderToBuffer(React.createElement(BoletaLiquidacionPDF, FIXTURE_ANULADA) as never),
  ]);
}, 30000);

describe('BoletaLiquidacionPDF', () => {
  it('BLP-1 renderToBuffer devuelve Buffer con magic bytes %PDF', () => {
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(5000);
    expect(buffer.slice(0, 4).toString()).toBe('%PDF');
  });

  it('BLP-2 contenido incluye DNI y nombre del trabajador (ASCII-safe)', async () => {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    const text = result.text;
    expect(text).toContain('12345678');    // DNI
    expect(text).toContain('Garcia');      // apellidoPaterno sin tilde
    expect(text).toContain('Juan Carlos'); // nombres
  });

  it('BLP-3 contenido incluye RUC y razon social de la empresa', async () => {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    const text = result.text;
    expect(text).toContain('20999888777'); // RUC
    expect(text).toContain('EMPRESA DEMO SRL');
  });

  it('BLP-4 liquidacion anulada genera PDF sin error (banner anulacion)', () => {
    expect(bufferAnulada).toBeInstanceOf(Buffer);
    expect(bufferAnulada.length).toBeGreaterThan(5000);
    expect(bufferAnulada.slice(0, 4).toString()).toBe('%PDF');
  });
});
