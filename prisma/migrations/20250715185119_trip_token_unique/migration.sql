/*
  Warnings:

  - A unique constraint covering the columns `[inviteToken]` on the table `Trip` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Trip_inviteToken_key" ON "Trip"("inviteToken");
