CREATE TABLE `User` (
  `id` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `fullName` VARCHAR(191) NOT NULL,
  `passwordHash` VARCHAR(255) NOT NULL,
  `role` ENUM('ADMIN', 'ORGANIZER', 'ATTENDEE') NOT NULL DEFAULT 'ATTENDEE',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `User_email_key` (`email`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Event` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `location` VARCHAR(255) NULL,
  `startsAt` DATETIME(3) NOT NULL,
  `endsAt` DATETIME(3) NOT NULL,
  `capacity` INTEGER NULL,
  `status` ENUM('DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED') NOT NULL DEFAULT 'DRAFT',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `Event_status_startsAt_idx` (`status`, `startsAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ScheduleItem` (
  `id` VARCHAR(191) NOT NULL,
  `eventId` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `startsAt` DATETIME(3) NOT NULL,
  `endsAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `ScheduleItem_eventId_startsAt_idx` (`eventId`, `startsAt`),
  CONSTRAINT `ScheduleItem_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Registration` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `eventId` VARCHAR(191) NOT NULL,
  `status` ENUM('PENDING', 'CONFIRMED', 'CANCELLED') NOT NULL DEFAULT 'CONFIRMED',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Registration_userId_eventId_key` (`userId`, `eventId`),
  INDEX `Registration_eventId_status_idx` (`eventId`, `status`),
  CONSTRAINT `Registration_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Registration_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Ticket` (
  `id` VARCHAR(191) NOT NULL,
  `registrationId` VARCHAR(191) NOT NULL,
  `qrCode` VARCHAR(191) NOT NULL,
  `checkedInAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Ticket_registrationId_key` (`registrationId`),
  UNIQUE INDEX `Ticket_qrCode_key` (`qrCode`),
  CONSTRAINT `Ticket_registrationId_fkey` FOREIGN KEY (`registrationId`) REFERENCES `Registration` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `EventFeedback` (
  `id` VARCHAR(191) NOT NULL,
  `eventId` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `rating` INTEGER NOT NULL,
  `comment` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `EventFeedback_eventId_userId_key` (`eventId`, `userId`),
  CONSTRAINT `EventFeedback_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `EventFeedback_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `BudgetItem` (
  `id` VARCHAR(191) NOT NULL,
  `eventId` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `amount` DECIMAL(12, 2) NOT NULL,
  `isIncome` BOOLEAN NOT NULL DEFAULT false,
  `note` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `BudgetItem_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AuditLog` (
  `id` VARCHAR(191) NOT NULL,
  `actorId` VARCHAR(191) NULL,
  `action` VARCHAR(100) NOT NULL,
  `entityType` VARCHAR(100) NOT NULL,
  `entityId` VARCHAR(191) NULL,
  `details` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `AuditLog_entityType_entityId_createdAt_idx` (`entityType`, `entityId`, `createdAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
