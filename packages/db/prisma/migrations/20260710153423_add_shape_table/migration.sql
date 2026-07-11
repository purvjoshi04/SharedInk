-- CreateTable
CREATE TABLE "shapes" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shapes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shapes_roomId_idx" ON "shapes"("roomId");

-- AddForeignKey
ALTER TABLE "shapes" ADD CONSTRAINT "shapes_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shapes" ADD CONSTRAINT "shapes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
