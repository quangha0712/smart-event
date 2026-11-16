-- Gộp Funding vào Sponsor: mỗi nhà tài trợ gắn với một sự kiện, kèm hạng và giá trị tài trợ.
-- Lưu ý: cột Sponsor.eventId là NOT NULL, bảng Sponsor phải đang rỗng (bảng mới tạo ở migration trước).

-- DropForeignKey
ALTER TABLE `Funding` DROP FOREIGN KEY `Funding_eventId_fkey`;

-- DropForeignKey
ALTER TABLE `Funding` DROP FOREIGN KEY `Funding_sponsorId_fkey`;

-- AlterTable
ALTER TABLE `Sponsor` ADD COLUMN `amount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `eventId` VARCHAR(191) NOT NULL,
    ADD COLUMN `tier` VARCHAR(50) NULL;

-- DropTable
DROP TABLE `Funding`;

-- CreateIndex
CREATE INDEX `Sponsor_eventId_idx` ON `Sponsor`(`eventId`);

-- AddForeignKey
ALTER TABLE `Sponsor` ADD CONSTRAINT `Sponsor_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

