import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('next/navigation', () => ({
  unauthorized: vi.fn(() => { throw new Error('UNAUTHORIZED'); }),
  forbidden: vi.fn(() => { throw new Error('FORBIDDEN'); }),
}));
vi.mock('@/lib/auth/guards', () => ({
  requireSession: vi.fn(),
  requireOwnership: vi.fn(),
}));
vi.mock('@/lib/prisma', () => ({
  prisma: { liquidacion: { findUnique: vi.fn() } },
}));
vi.mock('@react-pdf/renderer', () => ({
  renderToBuffer: vi.fn(),
  Font: { register: vi.fn() },
}));
vi.mock('@/components/pdf/BoletaLiquidacionPDF', () => ({
  BoletaLiquidacionPDF: () => null,
}));

import { requireSession, requireOwnership } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';
import { renderToBuffer } from '@react-pdf/renderer';
import { GET } from '../route';

const mockRequireSession = vi.mocked(requireSession);
const mockRequireOwnership = vi.mocked(requireOwnership);
const mockFindUnique = vi.mocked(prisma.liquidacion.findUnique);
const mockRenderToBuffer = vi.mocked(renderToBuffer);

const FAKE_PDF = Buffer.from('%PDF-fake-buffer');

const makeLiquidacion = (opts: { anulada?: boolean } = {}) => ({
  id: 'liq1',
  fechaCese: new Date('2025-03-31'),
  fechaCalculo: new Date('2025-04-01'),
  ctsTruncaMeses: 2,
  ctsTruncaDias: 15,
  ctsTrunca: { toNumber: () => 500 },
  gratificacionTruncaMeses: 2,
  gratificacionTruncaDias: 15,
  gratificacionTrunca: { toNumber: () => 333.33 },
  vacacionesTruncaMeses: 2,
  vacacionesTruncaDias: 15,
  vacacionesTruncas: { toNumber: () => 166.67 },
  remuneracionPendiente: { toNumber: () => 0 },
  totalBruto: { toNumber: () => 1000 },
  descuentos: { toNumber: () => 130 },
  totalNeto: { toNumber: () => 870 },
  anulada: opts.anulada ?? false,
  anuladaEn: opts.anulada ? new Date('2025-04-10') : null,
  motivoAnulacion: opts.anulada ? 'Error de calculo' : null,
  contrato: {
    empresaId: 'e1',
    cargo: 'Analista',
    regimenLaboral: 'REGIMEN_GENERAL',
    sistemaPensionario: 'ONP',
    fechaInicio: new Date('2023-01-01'),
    fechaFin: null,
    motivoCese: null,
    empresa: { razonSocial: 'DEMO SRL', ruc: '20000000001', direccion: 'Av. 1', distrito: 'Lima' },
    trabajador: {
      dni: '12345678',
      apellidoPaterno: 'Garcia',
      apellidoMaterno: 'Lopez',
      nombres: 'Juan',
    },
  },
});

function makeRequest(id = 'liq1') {
  return {
    request: new Request(`http://localhost/api/boletas/liquidacion/${id}`),
    params: Promise.resolve({ id }),
  };
}

beforeEach(() => vi.clearAllMocks());

describe('GET /api/boletas/liquidacion/[id]', () => {
  it('BLE-1 sin sesion → unauthorized re-thrown', async () => {
    mockRequireSession.mockRejectedValue(new Error('UNAUTHORIZED'));
    const { request, params } = makeRequest();
    await expect(GET(request, { params })).rejects.toThrow('UNAUTHORIZED');
  });

  it('BLE-2 ownership violado → forbidden re-thrown', async () => {
    mockRequireSession.mockResolvedValue(undefined as never);
    mockFindUnique.mockResolvedValue(makeLiquidacion() as never);
    mockRequireOwnership.mockRejectedValue(new Error('FORBIDDEN'));
    const { request, params } = makeRequest();
    await expect(GET(request, { params })).rejects.toThrow('FORBIDDEN');
  });

  it('BLE-3 id inexistente → 404', async () => {
    mockRequireSession.mockResolvedValue(undefined as never);
    mockFindUnique.mockResolvedValue(null as never);
    const { request, params } = makeRequest('no-existe');
    const res = await GET(request, { params });
    expect(res.status).toBe(404);
  });

  it('BLE-4 liquidacion vigente → 200 con headers correctos y filename con fechaCese', async () => {
    mockRequireSession.mockResolvedValue(undefined as never);
    mockFindUnique.mockResolvedValue(makeLiquidacion() as never);
    mockRequireOwnership.mockResolvedValue(undefined as never);
    mockRenderToBuffer.mockResolvedValue(FAKE_PDF as never);
    const { request, params } = makeRequest();
    const res = await GET(request, { params });
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
    expect(res.headers.get('Content-Disposition')).toContain('attachment');
    expect(res.headers.get('Content-Disposition')).toContain('liquidacion-12345678-20250331.pdf');
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    expect(mockRenderToBuffer).toHaveBeenCalled();
  });

  it('BLE-5 liquidacion anulada → 200 (anuladas permitidas)', async () => {
    mockRequireSession.mockResolvedValue(undefined as never);
    mockFindUnique.mockResolvedValue(makeLiquidacion({ anulada: true }) as never);
    mockRequireOwnership.mockResolvedValue(undefined as never);
    mockRenderToBuffer.mockResolvedValue(FAKE_PDF as never);
    const { request, params } = makeRequest();
    const res = await GET(request, { params });
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
  });

  it('BLE-6 Cache-Control no-store presente siempre', async () => {
    mockRequireSession.mockResolvedValue(undefined as never);
    mockFindUnique.mockResolvedValue(makeLiquidacion() as never);
    mockRequireOwnership.mockResolvedValue(undefined as never);
    mockRenderToBuffer.mockResolvedValue(FAKE_PDF as never);
    const { request, params } = makeRequest();
    const res = await GET(request, { params });
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });
});
