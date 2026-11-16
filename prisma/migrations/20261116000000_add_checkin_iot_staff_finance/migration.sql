-- AlterTable
ALTER TABLE `Ticket` ADD COLUMN `nfcUid` VARCHAR(64) NULL;

-- AlterTable: chuyển BudgetItem sang mô hình dự toán (giữ dữ liệu cũ)
-- `amount` cũ được đổi tên thành `plannedAmount`; unitPrice = plannedAmount, quantity = 1.
ALTER TABLE `BudgetItem` RENAME COLUMN `amount` TO `plannedAmount`;

ALTER TABLE `BudgetItem` MODIFY `plannedAmount` DECIMAL(15, 2) NOT NULL,
    ADD COLUMN `approvedAt` DATETIME(3) NULL,
    ADD COLUMN `approvedById` VARCHAR(191) NULL,
    ADD COLUMN `quantity` DECIMAL(12, 2) NOT NULL DEFAULT 1,
    ADD COLUMN `source` ENUM('MANUAL', 'AI_SUGGESTED') NOT NULL DEFAULT 'MANUAL',
    ADD COLUMN `unit` VARCHAR(30) NULL,
    ADD COLUMN `unitPrice` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `vendorId` VARCHAR(191) NULL;

UPDATE `BudgetItem` SET `unitPrice` = `plannedAmount`, `updatedAt` = `createdAt`;

-- Prisma quản lý @updatedAt ở tầng client, bỏ default tạm thời để khớp schema.
ALTER TABLE `BudgetItem` ALTER COLUMN `updatedAt` DROP DEFAULT;

-- CreateTable
CREATE TABLE `Device` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NULL,
    `code` VARCHAR(100) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('QR_SCANNER', 'NFC_READER', 'SENSOR', 'GATEWAY') NOT NULL,
    `location` VARCHAR(191) NULL,
    `isSimulated` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastSeenAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Device_code_key`(`code`),
    INDEX `Device_eventId_type_idx`(`eventId`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CheckInAttempt` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `ticketId` VARCHAR(191) NULL,
    `deviceId` VARCHAR(191) NULL,
    `operatorId` VARCHAR(191) NULL,
    `scannedCode` VARCHAR(191) NOT NULL,
    `method` ENUM('QR', 'NFC', 'MANUAL') NOT NULL DEFAULT 'QR',
    `result` ENUM('ACCEPTED', 'DUPLICATE', 'INVALID_CODE', 'WRONG_EVENT', 'NOT_ELIGIBLE') NOT NULL,
    `note` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CheckInAttempt_eventId_createdAt_idx`(`eventId`, `createdAt`),
    INDEX `CheckInAttempt_eventId_result_idx`(`eventId`, `result`),
    INDEX `CheckInAttempt_ticketId_idx`(`ticketId`),
    INDEX `CheckInAttempt_deviceId_idx`(`deviceId`),
    INDEX `CheckInAttempt_operatorId_idx`(`operatorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SensorReading` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `deviceId` VARCHAR(191) NOT NULL,
    `sensorType` ENUM('TEMPERATURE', 'HUMIDITY', 'CO2', 'NOISE', 'PEOPLE_COUNT', 'OTHER') NOT NULL,
    `value` DECIMAL(12, 3) NOT NULL,
    `unit` VARCHAR(20) NOT NULL,
    `recordedAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SensorReading_eventId_sensorType_recordedAt_idx`(`eventId`, `sensorType`, `recordedAt`),
    INDEX `SensorReading_deviceId_recordedAt_idx`(`deviceId`, `recordedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StaffMember` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(30) NULL,
    `position` VARCHAR(100) NULL,
    `skills` TEXT NULL,
    `note` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `StaffMember_userId_key`(`userId`),
    INDEX `StaffMember_fullName_idx`(`fullName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StaffAssignment` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `staffId` VARCHAR(191) NOT NULL,
    `role` VARCHAR(100) NOT NULL,
    `task` TEXT NULL,
    `startsAt` DATETIME(3) NULL,
    `endsAt` DATETIME(3) NULL,
    `status` ENUM('ASSIGNED', 'CONFIRMED', 'DECLINED', 'COMPLETED') NOT NULL DEFAULT 'ASSIGNED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `StaffAssignment_staffId_idx`(`staffId`),
    UNIQUE INDEX `StaffAssignment_eventId_staffId_role_key`(`eventId`, `staffId`, `role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Vendor` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `serviceType` VARCHAR(100) NOT NULL,
    `contactName` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(30) NULL,
    `address` VARCHAR(255) NULL,
    `taxCode` VARCHAR(30) NULL,
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Vendor_taxCode_key`(`taxCode`),
    INDEX `Vendor_serviceType_idx`(`serviceType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Sponsor` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `contactName` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(30) NULL,
    `website` VARCHAR(255) NULL,
    `logoUrl` VARCHAR(500) NULL,
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Sponsor_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Funding` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `sponsorId` VARCHAR(191) NULL,
    `sourceType` ENUM('SPONSOR', 'ORGANIZATION', 'TICKET_SALES', 'OTHER') NOT NULL,
    `kind` ENUM('CASH', 'IN_KIND') NOT NULL DEFAULT 'CASH',
    `tier` VARCHAR(50) NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('PLEDGED', 'RECEIVED', 'CANCELLED') NOT NULL DEFAULT 'PLEDGED',
    `receivedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Funding_eventId_status_idx`(`eventId`, `status`),
    INDEX `Funding_sponsorId_idx`(`sponsorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Expense` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `budgetItemId` VARCHAR(191) NULL,
    `vendorId` VARCHAR(191) NULL,
    `recordedById` VARCHAR(191) NULL,
    `description` VARCHAR(255) NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `paidAt` DATETIME(3) NOT NULL,
    `invoiceNumber` VARCHAR(100) NULL,
    `attachmentUrl` VARCHAR(500) NULL,
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Expense_eventId_paidAt_idx`(`eventId`, `paidAt`),
    INDEX `Expense_budgetItemId_idx`(`budgetItemId`),
    INDEX `Expense_vendorId_idx`(`vendorId`),
    INDEX `Expense_recordedById_idx`(`recordedById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Ticket_nfcUid_key` ON `Ticket`(`nfcUid`);

-- CreateIndex
CREATE INDEX `BudgetItem_eventId_category_idx` ON `BudgetItem`(`eventId`, `category`);

-- CreateIndex
CREATE INDEX `BudgetItem_vendorId_idx` ON `BudgetItem`(`vendorId`);

-- CreateIndex
CREATE INDEX `BudgetItem_approvedById_idx` ON `BudgetItem`(`approvedById`);

-- AddForeignKey
ALTER TABLE `Device` ADD CONSTRAINT `Device_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CheckInAttempt` ADD CONSTRAINT `CheckInAttempt_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CheckInAttempt` ADD CONSTRAINT `CheckInAttempt_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `Ticket`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CheckInAttempt` ADD CONSTRAINT `CheckInAttempt_deviceId_fkey` FOREIGN KEY (`deviceId`) REFERENCES `Device`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CheckInAttempt` ADD CONSTRAINT `CheckInAttempt_operatorId_fkey` FOREIGN KEY (`operatorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SensorReading` ADD CONSTRAINT `SensorReading_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SensorReading` ADD CONSTRAINT `SensorReading_deviceId_fkey` FOREIGN KEY (`deviceId`) REFERENCES `Device`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StaffMember` ADD CONSTRAINT `StaffMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StaffAssignment` ADD CONSTRAINT `StaffAssignment_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StaffAssignment` ADD CONSTRAINT `StaffAssignment_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `StaffMember`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Funding` ADD CONSTRAINT `Funding_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Funding` ADD CONSTRAINT `Funding_sponsorId_fkey` FOREIGN KEY (`sponsorId`) REFERENCES `Sponsor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BudgetItem` ADD CONSTRAINT `BudgetItem_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `Vendor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BudgetItem` ADD CONSTRAINT `BudgetItem_approvedById_fkey` FOREIGN KEY (`approvedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Expense` ADD CONSTRAINT `Expense_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Expense` ADD CONSTRAINT `Expense_budgetItemId_fkey` FOREIGN KEY (`budgetItemId`) REFERENCES `BudgetItem`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Expense` ADD CONSTRAINT `Expense_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `Vendor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Expense` ADD CONSTRAINT `Expense_recordedById_fkey` FOREIGN KEY (`recordedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

