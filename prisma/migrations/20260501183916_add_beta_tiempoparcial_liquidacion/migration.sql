/*
  Warnings:

  - You are about to drop the column `ctsTruncaTotal` on the `liquidaciones` table. All the data in the column will be lost.
  - You are about to drop the column `gratificacionTruncaTotal` on the `liquidaciones` table. All the data in the column will be lost.
  - You are about to drop the column `vacacionesTruncaTotal` on the `liquidaciones` table. All the data in the column will be lost.
  - Added the required column `ctsTrunca` to the `liquidaciones` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fechaCese` to the `liquidaciones` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gratificacionTrunca` to the `liquidaciones` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vacacionesTruncas` to the `liquidaciones` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "contratos" ADD COLUMN     "esTiempoParcial" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recibeBETA" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "liquidaciones" DROP COLUMN "ctsTruncaTotal",
DROP COLUMN "gratificacionTruncaTotal",
DROP COLUMN "vacacionesTruncaTotal",
ADD COLUMN     "ctsTrunca" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "fechaCese" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "gratificacionTrunca" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "remuneracionPendiente" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "vacacionesTruncas" DECIMAL(10,2) NOT NULL;
