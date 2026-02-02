/**
 * Formats a date string to DD/MM/YY format with separate date and time
 * @param dateString - ISO date string (e.g., "2026-02-02T05:25:27.960Z")
 * @returns Object with date and time strings
 */
export const formatDateTime = (dateString: string) => {
  if (!dateString) return { date: '-', time: '' };
  
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) return { date: '-', time: '' };
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return {
      date: `${day}/${month}/${year}`,
      time: `${hours}:${minutes}`
    };
  } catch (error) {
    console.error('Error formatting date:', error);
    return { date: '-', time: '' };
  }
};