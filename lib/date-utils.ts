'use client';

import { format, parseISO } from 'date-fns';

/**
 * Format a date with consistent formatting across server and client
 * to prevent hydration errors
 * 
 * @param dateString ISO date string or Date object
 * @param formatString date-fns format string (default: 'PPP')
 * @returns Formatted date string
 */
export function formatDate(dateString: string | Date | null | undefined, formatString: string = 'PPP'): string {
  if (!dateString) return 'N/A';
  
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return format(date, formatString);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

/**
 * Format a date for display in a consistent way that won't cause hydration errors
 * This function is safe to use in both server and client components
 * 
 * @param dateString ISO date string or Date object
 * @returns Formatted date string with time
 */
export function formatDateTime(dateString: string | Date | null | undefined): string {
  return formatDate(dateString, 'PPP p');
}

/**
 * Format a date as a short date (e.g., 'Jan 1, 2023')
 * 
 * @param dateString ISO date string or Date object
 * @returns Formatted short date string
 */
export function formatShortDate(dateString: string | Date | null | undefined): string {
  return formatDate(dateString, 'MMM d, yyyy');
}