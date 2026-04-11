-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'CONTADOR', 'CLIENTE');

-- CreateEnum
CREATE TYPE "TipoEmpresa" AS ENUM ('PERSONA_NATURAL', 'EIRL', 'SRL', 'SAC', 'SA', 'OTRO');

-- CreateEnum
CREATE TYPE "RegimenLaboral" AS ENUM ('GENERAL', 'MYPE_MICRO', 'MYPE_PEQUENA', 'CONSTRUCCION_CIVIL', 'AGRARIO');

-- CreateEnum
CREATE TYPE "SistemaPensionario" AS ENUM ('ONP', 'AFP_HABITAT', 'AFP_INTEGRA', 'AFP_PRIMA', 'AFP_PROFUTURO', 'SIN_REGIMEN');

-- CreateEnum
CREATE TYPE "FrecuenciaPago" AS ENUM ('SEMANAL', 'QUINCENAL', 'MENSUAL');

-- CreateEnum
CREATE TYPE "TipoContrato" AS ENUM ('INDEFINIDO', 'PLAZO_FIJO', 'TIEMPO_PARCIAL', 'INICIO_ACTIVIDAD', 'NECESIDAD_MERCADO', 'OBRA_DETERMINADA');

-- CreateEnum
CREATE TYPE "CategoriaCC" AS ENUM ('OPERARIO', 'OFICIAL', 'PEON', 'NINGUNA');

-- CreateEnum
CREATE TYPE "EstadoPeriodo" AS ENUM ('ABIERTO', 'CALCULADO', 'CERRADO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios_empresas" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,

    CONSTRAINT "usuarios_empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empresas" (
    "id" TEXT NOT NULL,
    "ruc" TEXT NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "nombreComercial" TEXT,
    "tipoEmpresa" "TipoEmpresa" NOT NULL,
    "direccion" TEXT NOT NULL,
    "distrito" TEXT NOT NULL,
    "provincia" TEXT NOT NULL,
    "departamento" TEXT NOT NULL,
    "telefono" TEXT,
    "email" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trabajadores" (
    "id" TEXT NOT NULL,
    "dni" TEXT NOT NULL,
    "apellidoPaterno" TEXT NOT NULL,
    "apellidoMaterno" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "fechaNacimiento" TIMESTAMP(3) NOT NULL,
    "sexo" TEXT NOT NULL,
    "direccion" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "estadoCivil" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trabajadores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hijos" (
    "id" TEXT NOT NULL,
    "trabajadorId" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "fechaNacimiento" TIMESTAMP(3) NOT NULL,
    "dni" TEXT,

    CONSTRAINT "hijos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contratos" (
    "id" TEXT NOT NULL,
    "trabajadorId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "regimenLaboral" "RegimenLaboral" NOT NULL,
    "tipoContrato" "TipoContrato" NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3),
    "cargo" TEXT NOT NULL,
    "remuneracionBase" DECIMAL(10,2) NOT NULL,
    "frecuenciaPago" "FrecuenciaPago" NOT NULL,
    "sistemaPensionario" "SistemaPensionario" NOT NULL,
    "tieneAsignacionFamiliar" BOOLEAN NOT NULL DEFAULT false,
    "jornadaSemanal" INTEGER NOT NULL DEFAULT 48,
    "categoriaCC" "CategoriaCC" NOT NULL DEFAULT 'NINGUNA',
    "zonaBonificacion" TEXT,
    "motivoCese" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contratos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "periodos" (
    "id" TEXT NOT NULL,
    "mes" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "estado" "EstadoPeriodo" NOT NULL DEFAULT 'ABIERTO',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "periodos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planilla_detalles" (
    "id" TEXT NOT NULL,
    "periodoId" TEXT NOT NULL,
    "contratoId" TEXT NOT NULL,
    "diasTrabajados" INTEGER NOT NULL DEFAULT 30,
    "diasNoTrabajados" INTEGER NOT NULL DEFAULT 0,
    "horasExtras25" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "horasExtras35" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "horasExtras100" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "minutosAtraso" INTEGER NOT NULL DEFAULT 0,
    "faltas" INTEGER NOT NULL DEFAULT 0,
    "feriados" INTEGER NOT NULL DEFAULT 0,
    "remuneracionBasica" DECIMAL(10,2) NOT NULL,
    "horasExtrasTotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "asignacionFamiliar" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "bonificacionCC" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "movilidadCC" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "bonificacionAltura" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "otrosIngresos" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalIngresos" DECIMAL(10,2) NOT NULL,
    "descuentoOnp" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "descuentoAfp" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "comisionAfp" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "primaSeguroAfp" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "retencionQuinta" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "otrosDescuentos" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalDescuentos" DECIMAL(10,2) NOT NULL,
    "essalud" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "sctr" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalAportesEmpleador" DECIMAL(10,2) NOT NULL,
    "netoPagar" DECIMAL(10,2) NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planilla_detalles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boletas" (
    "id" TEXT NOT NULL,
    "planillaDetalleId" TEXT NOT NULL,
    "archivoUrl" TEXT,
    "generadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enviada" BOOLEAN NOT NULL DEFAULT false,
    "enviadaEn" TIMESTAMP(3),

    CONSTRAINT "boletas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "liquidaciones" (
    "id" TEXT NOT NULL,
    "contratoId" TEXT NOT NULL,
    "fechaCalculo" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ctsTruncaMeses" INTEGER NOT NULL DEFAULT 0,
    "ctsTruncaDias" INTEGER NOT NULL DEFAULT 0,
    "ctsTruncaTotal" DECIMAL(10,2) NOT NULL,
    "vacacionesTruncaMeses" INTEGER NOT NULL DEFAULT 0,
    "vacacionesTruncaDias" INTEGER NOT NULL DEFAULT 0,
    "vacacionesTruncaTotal" DECIMAL(10,2) NOT NULL,
    "gratificacionTruncaMeses" INTEGER NOT NULL DEFAULT 0,
    "gratificacionTruncaDias" INTEGER NOT NULL DEFAULT 0,
    "gratificacionTruncaTotal" DECIMAL(10,2) NOT NULL,
    "totalBruto" DECIMAL(10,2) NOT NULL,
    "descuentos" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalNeto" DECIMAL(10,2) NOT NULL,
    "archivoUrl" TEXT,

    CONSTRAINT "liquidaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parametros_legales" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "valor" DECIMAL(10,4) NOT NULL,
    "vigenciaDesde" TIMESTAMP(3) NOT NULL,
    "vigenciaHasta" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parametros_legales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_empresas_usuarioId_empresaId_key" ON "usuarios_empresas"("usuarioId", "empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "empresas_ruc_key" ON "empresas"("ruc");

-- CreateIndex
CREATE UNIQUE INDEX "trabajadores_dni_key" ON "trabajadores"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "periodos_mes_anio_key" ON "periodos"("mes", "anio");

-- CreateIndex
CREATE UNIQUE INDEX "planilla_detalles_periodoId_contratoId_key" ON "planilla_detalles"("periodoId", "contratoId");

-- CreateIndex
CREATE UNIQUE INDEX "boletas_planillaDetalleId_key" ON "boletas"("planillaDetalleId");

-- CreateIndex
CREATE UNIQUE INDEX "liquidaciones_contratoId_key" ON "liquidaciones"("contratoId");

-- CreateIndex
CREATE INDEX "parametros_legales_codigo_vigenciaDesde_idx" ON "parametros_legales"("codigo", "vigenciaDesde");

-- AddForeignKey
ALTER TABLE "usuarios_empresas" ADD CONSTRAINT "usuarios_empresas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios_empresas" ADD CONSTRAINT "usuarios_empresas_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hijos" ADD CONSTRAINT "hijos_trabajadorId_fkey" FOREIGN KEY ("trabajadorId") REFERENCES "trabajadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_trabajadorId_fkey" FOREIGN KEY ("trabajadorId") REFERENCES "trabajadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planilla_detalles" ADD CONSTRAINT "planilla_detalles_periodoId_fkey" FOREIGN KEY ("periodoId") REFERENCES "periodos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planilla_detalles" ADD CONSTRAINT "planilla_detalles_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "contratos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boletas" ADD CONSTRAINT "boletas_planillaDetalleId_fkey" FOREIGN KEY ("planillaDetalleId") REFERENCES "planilla_detalles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liquidaciones" ADD CONSTRAINT "liquidaciones_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "contratos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
