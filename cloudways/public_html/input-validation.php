<?php
declare(strict_types=1);
function alwdaifDeadlineMillis(mixed $value): ?int
{
    if ($value === null || $value === '') return null;
    if (is_int($value) || (is_string($value) && ctype_digit(trim($value)))) {
        $timestamp = filter_var($value, FILTER_VALIDATE_INT);
        if ($timestamp !== false && $timestamp >= 0 && $timestamp <= 253402300799000) return $timestamp;
        throw new InvalidArgumentException('تاريخ الانتهاء غير صالح');
    }
    if (!is_string($value)) throw new InvalidArgumentException('تاريخ الانتهاء غير صالح');
    $raw = trim($value);
    $dateOnly = preg_match('/^\d{4}-\d{2}-\d{2}$/', $raw) === 1;
    if (!$dateOnly && preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/', $raw) !== 1) throw new InvalidArgumentException('تاريخ الانتهاء غير صالح');
    try {
        $date = $dateOnly ? DateTimeImmutable::createFromFormat('!Y-m-d', $raw, new DateTimeZone('Asia/Riyadh')) : new DateTimeImmutable($raw);
        $errors = DateTimeImmutable::getLastErrors();
        if (!$date || ($errors !== false && ($errors['warning_count'] || $errors['error_count']))) throw new InvalidArgumentException('تاريخ الانتهاء غير صالح');
        if ($dateOnly) $date = $date->setTime(23,59,59);
        return $date->getTimestamp() * 1000;
    } catch (Exception $error) {
        throw new InvalidArgumentException('تاريخ الانتهاء غير صالح', 0, $error);
    }
}
