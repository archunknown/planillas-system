-- DropIndex
DROP INDEX "liquidaciones_contratoId_key";

-- AlterTable
ALTER TABLE "liquidaciones" ADD COLUMN     "anulada" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "anuladaEn" TIMESTAMP(3),
ADD COLUMN     "motivoAnulacion" TEXT;
