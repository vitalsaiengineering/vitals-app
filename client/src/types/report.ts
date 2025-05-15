export interface Report {
  id: string;
  name: string;
  description: string;
  integrations: string; // Could be more complex, e.g., an array of data sources
  status?: 'Coming Soon'; // Optional status
  isFavorite?: boolean; // Optional for star icon
}