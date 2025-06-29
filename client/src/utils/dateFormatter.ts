/**
 * Formats a date string to MM-DD-YYYY format
 * @param dateString - The input date string to format
 * @returns The formatted date string in MM-DD-YYYY format
 */
export const formatDate = (dateString: string | null | undefined): string => {
  try {
    // Handle null, undefined, or empty string
    if (!dateString || typeof dateString !== 'string') {
      return '';
    }

    // Create a new Date object from the input string
    const date = new Date(dateString);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date string provided: ${dateString}`);
      return '';
    }

    // Extract month, day, and year
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();

    // Return formatted date string
    return `${month}-${day}-${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

// Default export for convenience
export default formatDate; 