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
  prisma: { planillaDetalle: { findUnique: vi.fn() } },
}));
vi.mock('@react-pdf/renderer', () => ({
  renderToBuffer: vi.fn(),
  Font: { register: vi.fn() },
}));
// Mock BoletaPagoPDF so tests don't depend on react-pdf internals
vi.mock('@/components/pdf/BoletaPagoPDF', () => ({
  BoletaPagoPDF: () => null,
}));

import { requireSession, requireOwnership } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';
import { renderToBuffer } from '@react-pdf/renderer';
import { GET } from '../route';

const mockRequireSession = vi.mocked(requireSession);
const mockRequireOwnership = vi.mocked(requireOwnership);
const mockFindUnique = vi.mocked(prisma.planillaDetalle.findUnique);
const mockRenderToBuffer = vi.mocked(renderToBuffer);

const FAKE_PDF = Buffer.from('%PDF-fake-buffer');

const makeDetalle = (estado: 'ABIERTO' | 'CALCULADO' | 'CERRADO') => ({
  id: 'd1',
  diasTrabajados: 30,
  diasNoTrabajados: 0,
  faltas: 0,
  feriados: 0,
  remuneracionBasica: { toNumber: () => 1000 },
  horasExtrasTotal: { toNumber: () => 0 },
  asignacionFamiliar: { toNumber: () => 0 },
  bonificacionCC: { toNumber: () => 0 },
  movilidadCC: { toNumber: () => 0 },
  bonificacionAltura: { toNumber: () => 0 },
  asignacionEscolar: { toNumber: () => 0 },
  otrosIngresos: { toNumber: () => 0 },
  totalIngresos: { toNumber: () => 1000 },
  descuentoOnp: { toNumber: () => 130 },
  descuentoAfp: { toNumber: () => 0 },
  comisionAfp: { toNumber: () => 0 },
  primaSeguroAfp: { toNumber: () => 0 },
  retencionQuinta: { toNumber: () => 0 },
  otrosDescuentos: { toNumber: () => 0 },
  totalDescuentos: { toNumber: () => 130 },
  essalud: { toNumber: () => 90 },
  sctr: { toNumber: () => 0 },
  netoPagar: { toNumber: () => 870 },
  periodo: {
    empresaId: 'e1',
    mes: 1,
    anio: 2025,
    estado,
    empresa: { razonSocial: 'DEMO SRL', ruc: '20000000001', direccion: 'Av. 1', distrito: 'Lima' },
  },
  contrato: {
    cargo: 'Analista',
    regimenLaboral: 'REGIMEN_GENERAL',
    sistemaPensionario: 'ONP',
    fechaInicio: new Date('2023-01-01'),
    trabajador: { dni: '12345678', apellidoPaterno: 'Garcia', apellidoMaterno: 'Lopez', nombres: 'Juan' },
  },
});

function makeRequest(detalleId = 'd1') {
  return {
    request: new Request(`http://localhost/api/boletas/pago/${detalleId}`),
    params: Promise.resolve({ detalleId }),
  };
}

beforeEach(() => vi.clearAllMocks());

describe('GET /api/boletas/pago/[detalleId]', () => {
  it('BPE-1 sin sesion → unauthorized re-thrown', async () => {
    mockRequireSession.mockRejectedValue(new Error('UNAUTHORIZED'));
    const { request, params } = makeRequest();
    await expect(GET(request, { params })).rejects.toThrow('UNAUTHORIZED');
  });

  it('BPE-2 ownership violado → forbidden re-thrown', async () => {
    mockRequireSession.mockResolvedValue(undefined as never);
    mockFindUnique.mockResolvedValue(makeDetalle('CALCULADO') as never);
    mockRequireOwnership.mockRejectedValue(new Error('FORBIDDEN'));
    const { request, params } = makeRequest();
    await expect(GET(request, { params })).rejects.toThrow('FORBIDDEN');
  });

  it('BPE-3 detalleId inexistente → 404', async () => {
    mockRequireSession.mockResolvedValue(undefined as never);
    mockFindUnique.mockResolvedValue(null as never);
    const { request, params } = makeRequest('no-existe');
    const res = await GET(request, { params });
    expect(res.status).toBe(404);
  });

  it('BPE-4 estado ABIERTO → 409', async () => {
    mockRequireSession.mockResolvedValue(undefined as never);
    mockFindUnique.mockResolvedValue(makeDetalle('ABIERTO') as never);
    mockRequireOwnership.mockResolvedValue(undefined as never);
    const { request, params } = makeRequest();
    const res = await GET(request, { params });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toMatch(/sin calcular/i);
  });

  it('BPE-5 estado CALCULADO → 200 con Content-Type application/pdf y filename correcto', async () => {
    mockRequireSession.mockResolvedValue(undefined as never);
    mockFindUnique.mockResolvedValue(makeDetalle('CALCULADO') as never);
    mockRequireOwnership.mockResolvedValue(undefined as never);
    mockRenderToBuffer.mockResolvedValue(FAKE_PDF as never);
    const { request, params } = makeRequest();
    const res = await GET(request, { params });
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
    expect(res.headers.get('Content-Disposition')).toContain('attachment');
    expect(res.headers.get('Content-Disposition')).toContain('boleta-12345678-2025-01.pdf');
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    expect(mockRenderToBuffer).toHaveBeenCalled();
  });

  it('BPE-6 estado CERRADO → 200 idem', async () => {
    mockRequireSession.mockResolvedValue(undefined as never);
    mockFindUnique.mockResolvedValue(makeDetalle('CERRADO') as never);
    mockRequireOwnership.mockResolvedValue(undefined as never);
    mockRenderToBuffer.mockResolvedValue(FAKE_PDF as never);
    const { request, params } = makeRequest();
    const res = await GET(request, { params });
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
  });
});
