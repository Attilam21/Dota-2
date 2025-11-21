/**
 * Dota 2 Formatting Utilities
 *
 * Utility functions for formatting Dota 2 values with proper null handling.
 * Implements uniform system for displaying unavailable data as "—" with tooltip.
 */

/**
 * Format a numeric value or return "—" if null/undefined/NaN
 *
 * @param value - Numeric value to format
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted string or JSX element with "—" and tooltip
 */
export function formatValueOrNA(
  value: number | null | undefined,
  decimals: number = 0,
): string | JSX.Element {
  if (value === null || value === undefined || isNaN(value)) {
    return '—'
  }

  if (decimals === 0) {
    return value.toFixed(0)
  }

  return value.toFixed(decimals)
}

/**
 * Format a value for display with thousands separator (e.g., "1.5k")
 * Returns "—" if value is null/undefined/NaN
 *
 * @param value - Numeric value to format
 * @returns Formatted string (e.g., "1.5k") or "—"
 */
export function formatNumberOrNA(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '—'
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`
  }

  return value.toFixed(0)
}

/**
 * Format percentage value
 * Returns "—" if value is null/undefined/NaN
 *
 * @param value - Percentage value (0-100)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted string (e.g., "45.2%") or "—"
 */
export function formatPercentageOrNA(
  value: number | null | undefined,
  decimals: number = 1,
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '—'
  }

  return `${value.toFixed(decimals)}%`
}

/**
 * Format time in seconds to MM:SS format
 * Returns "—" if value is null/undefined/NaN
 *
 * @param seconds - Time in seconds
 * @returns Formatted string (e.g., "45:30") or "—"
 */
export function formatTimeOrNA(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || isNaN(seconds)) {
    return '—'
  }

  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${String(secs).padStart(2, '0')}`
}

/**
 * Check if a value is truly null/undefined/NaN (not zero)
 *
 * @param value - Value to check
 * @returns True if value should be treated as missing data
 */
export function isValueMissing(value: number | null | undefined): boolean {
  return value === null || value === undefined || isNaN(value)
}
