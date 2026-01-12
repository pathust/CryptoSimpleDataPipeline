/**
 * Time formatting utilities for charts
 * 
 * Lightweight-charts automatically converts UTC timestamps to browser's local timezone.
 * This utility provides consistent time formatting for Recharts components to match.
 */

/**
 * Format UTC time string to local time HH:MM format (24-hour)
 * Matches the format displayed by lightweight-charts
 * 
 * @param utcTimeString - UTC time string in ISO format (e.g., "2026-01-15T14:30:00Z")
 * @returns Time string in format "HH:MM" (24-hour format)
 */
export function formatChartTime(utcTimeString: string): string {
    const date = new Date(utcTimeString);
    // Browser automatically converts UTC to local timezone
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

/**
 * Format UTC time string to full date-time string for tooltips
 * 
 * @param utcTimeString - UTC time string in ISO format
 * @returns Formatted string like "Jan 15, 10:45"
 */
export function formatChartDateTime(utcTimeString: string): string {
    const date = new Date(utcTimeString);
    // Browser automatically converts UTC to local timezone
    const day = date.getDate();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${month} ${day}, ${hours}:${minutes}`;
}
