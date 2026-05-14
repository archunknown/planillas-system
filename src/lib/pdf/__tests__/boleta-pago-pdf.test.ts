// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { PDFParse } from 'pdf-parse';
import { BoletaPagoPDF } from '@/components/pdf/BoletaPagoPDF';
import type { BoletaPagoData } from '@/components/pdf/BoletaPagoPDF';

// pdf-parse v2 API: new PDFParse({ data: buffer }).getText()
// Non-ASCII text extraction (tildes, ñ) is unreliable due to ToUnicode CMap limitations
// in @react-pdf/renderer. Assertions use ASCII-safe fields: RUC, DNI, numeric amounts.

const FIXTURE: BoletaPagoData = {
  detalle: {
    id: 'd1',
    diasTrabajados: 30,
    diasNoTrabajados: 0,
    faltas: 0,
    feriados: 0,
    remuneracionBasica: 1000.00,
    horasExtrasTotal: 0,
    asignacionFamiliar: 0,
    bonificacionCC: 0,
    movilidadCC: 0,
    bonificacionAltura: 0,
    asignacionEscolar: 0,
    otrosIngresos: 0,
    totalIngresos: 1000.00,
    descuentoOnp: 130.00,
    descuentoAfp: 0,
    comisionAfp: 0,
    primaSeguroAfp: 0,
    retencionQuinta: 0,
    otrosDescuentos: 0,
    totalDescuentos: 130.00,
    essalud: 90.00,
    sctr: 0,
    netoPagar: 870.00,
    periodo: {
      mes: 1,
      anio: 2025,
      empresa: {
        razonSocial: 'EMPRESA DEMO SRL',
        ruc: '20999888777',
        direccion: 'Av. Principal 123',
        distrito: 'Lima',
      },
    },
    contrato: {
      cargo: 'Analista',
      regimenLaboral: 'REGIMEN_GENERAL',
      sistemaPensionario: 'ONP',
      fechaInicio: new Date('2023-01-01'),
      trabajador: {
        dni: '12345678',
        apellidoPaterno: 'Garcia',
        apellidoMaterno: 'Lopez',
        nombres: 'Juan Carlos',
      },
    },
  },
  fechaEmision: new Date('2025-02-01'),
};

let buffer: Buffer;

beforeAll(async () => {
  buffer = await renderToBuffer(React.createElement(BoletaPagoPDF, FIXTURE) as never);
}, 30000);

describe('BoletaPagoPDF', () => {
  it('BPP-1 renderToBuffer devuelve Buffer con magic bytes %PDF', () => {
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(5000);
    expect(buffer.slice(0, 4).toString()).toBe('%PDF');
  });

  it('BPP-2 contenido incluye DNI y nombre del trabajador (ASCII-safe)', async () => {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    const text = result.text;
    expect(text).toContain('12345678');    // DNI
    expect(text).toContain('Garcia');      // apellidoPaterno sin tilde
    expect(text).toContain('Juan Carlos'); // nombres
  });

  it('BPP-3 contenido incluye RUC y razon social de la empresa', async () => {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    const text = result.text;
    expect(text).toContain('20999888777'); // RUC
    expect(text).toContain('EMPRESA DEMO SRL');
  });
});
