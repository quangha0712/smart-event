-- Thành viên ban tổ chức theo sự kiện (EventMember) + người tạo sự kiện (Event.createdById).
-- Dữ liệu cũ: sự kiện đã có chưa có thành viên nào -> chỉ ADMIN thao tác được cho tới khi ADMIN gán Chủ sự kiện
-- qua POST /events/:eventId/members { email, role: "OWNER" }. Seed tự gán organizer@example.com làm OWNER của sự kiện demo.

-- AlterTable
ALTER TABLE `Event` ADD COLUMN `createdById` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `EventMember` (
    `eventId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `role` ENUM('OWNER', 'CO_ORGANIZER', 'CHECKIN_STAFF') NOT NULL,
    `invitedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `EventMember_userId_idx`(`userId`),
    INDEX `EventMember_invitedById_idx`(`invitedById`),
    PRIMARY KEY (`eventId`, `userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Event_createdById_idx` ON `Event`(`createdById`);

-- AddForeignKey
ALTER TABLE `EventMember` ADD CONSTRAINT `EventMember_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventMember` ADD CONSTRAINT `EventMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventMember` ADD CONSTRAINT `EventMember_invitedById_fkey` FOREIGN KEY (`invitedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

