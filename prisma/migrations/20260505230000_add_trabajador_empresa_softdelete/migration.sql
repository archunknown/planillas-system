-- DropIndex
DROP INDEX "trabajadores_dni_key";

-- AlterTable
ALTER TABLE "hijos" ADD COLUMN     "eliminadoEn" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "trabajadores" ADD COLUMN     "eliminadoEn" TIMESTAMP(3),
ADD COLUMN     "empresaId" TEXT NOT NULL DEFAULT '';

-- Prisma requiere NOT NULL; como la tabla está vacía el DEFAULT '' no genera conflictos.
-- Limpiamos el default tras la migración estructural.
ALTER TABLE "trabajadores" ALTER COLUMN "empresaId" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "trabajadores_dni_empresaId_key" ON "trabajadores"("dni", "empresaId");

-- AddForeignKey
ALTER TABLE "trabajadores" ADD CONSTRAINT "trabajadores_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
