-- DropIndex
DROP INDEX "periodos_mes_anio_key";

-- AlterTable
ALTER TABLE "periodos" ADD COLUMN "empresaId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "periodos_empresaId_mes_anio_key" ON "periodos"("empresaId", "mes", "anio");

-- AddForeignKey
ALTER TABLE "periodos" ADD CONSTRAINT "periodos_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
