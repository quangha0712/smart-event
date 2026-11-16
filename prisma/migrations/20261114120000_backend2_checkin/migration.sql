ALTER TABLE `Event`
  ADD COLUMN `registeredCount` INTEGER NOT NULL DEFAULT 0;

UPDATE `Event` AS e
SET `registeredCount` = (
  SELECT COUNT(*)
  FROM `Registration` AS r
  WHERE r.`eventId` = e.`id` AND r.`status` = 'CONFIRMED'
);

CREATE TABLE `CheckInAttempt` (
  `id` VARCHAR(191) NOT NULL,
  `eventId` VARCHAR(191) NOT NULL,
  `ticketId` VARCHAR(191) NULL,
  `status` ENUM('ACCEPTED', 'ALREADY_USED', 'INVALID') NOT NULL,
  `scannedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `CheckInAttempt_eventId_scannedAt_idx` (`eventId`, `scannedAt`),
  INDEX `CheckInAttempt_eventId_status_scannedAt_idx` (`eventId`, `status`, `scannedAt`),
  INDEX `CheckInAttempt_ticketId_scannedAt_idx` (`ticketId`, `scannedAt`),
  CONSTRAINT `CheckInAttempt_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `CheckInAttempt_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `Ticket` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
