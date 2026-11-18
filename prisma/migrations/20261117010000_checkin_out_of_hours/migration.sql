-- Kết quả quét mới: OUT_OF_HOURS (quét ngoài giờ check-in, vé không bị đánh dấu đã check-in).

-- AlterTable
ALTER TABLE `CheckInAttempt` MODIFY `result` ENUM('ACCEPTED', 'DUPLICATE', 'INVALID_CODE', 'WRONG_EVENT', 'NOT_ELIGIBLE', 'OUT_OF_HOURS') NOT NULL;

