ALTER TABLE `CheckInAttempt`
  ADD COLUMN `deviceId` VARCHAR(191) NOT NULL DEFAULT 'legacy-unknown';

ALTER TABLE `CheckInAttempt`
  ALTER COLUMN `deviceId` DROP DEFAULT;
