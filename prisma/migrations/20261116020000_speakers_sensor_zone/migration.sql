-- Diễn giả cho lịch trình (nhiều-nhiều với ScheduleItem), phòng của phiên, khu vực đo của cảm biến.

-- AlterTable
ALTER TABLE `ScheduleItem` ADD COLUMN `room` VARCHAR(100) NULL;

-- AlterTable
ALTER TABLE `SensorReading` ADD COLUMN `zone` VARCHAR(100) NULL;

-- CreateTable
CREATE TABLE `Speaker` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NULL,
    `organization` VARCHAR(191) NULL,
    `bio` TEXT NULL,
    `email` VARCHAR(191) NULL,
    `avatarUrl` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Speaker_eventId_idx`(`eventId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_ScheduleItemToSpeaker` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_ScheduleItemToSpeaker_AB_unique`(`A`, `B`),
    INDEX `_ScheduleItemToSpeaker_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `SensorReading_eventId_zone_recordedAt_idx` ON `SensorReading`(`eventId`, `zone`, `recordedAt`);

-- AddForeignKey
ALTER TABLE `Speaker` ADD CONSTRAINT `Speaker_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ScheduleItemToSpeaker` ADD CONSTRAINT `_ScheduleItemToSpeaker_A_fkey` FOREIGN KEY (`A`) REFERENCES `ScheduleItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ScheduleItemToSpeaker` ADD CONSTRAINT `_ScheduleItemToSpeaker_B_fkey` FOREIGN KEY (`B`) REFERENCES `Speaker`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

