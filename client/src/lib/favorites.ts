import React from "react";
import { LineChart } from "lucide-react";

export type FavoriteReport = {
  id: string;
  name: string;
  path: string;
  icon?: React.ElementType;
};

const FAVORITES_KEY = "favoriteReports";

export const getFavoriteReports = (): FavoriteReport[] => {
  try {
    const storedFavorites = localStorage.getItem(FAVORITES_KEY);
    if (storedFavorites) {
      const favoriteIds = JSON.parse(storedFavorites);
      if (Array.isArray(favoriteIds)) {
        // Convert old format (just IDs) to new format if needed
        if (favoriteIds.length > 0 && typeof favoriteIds[0] === 'string') {
          // This is the old format, we need to migrate or handle differently
          return favoriteIds.map((id: string) => ({
            id,
            name: getReportNameFromId(id),
            path: getReportPathFromId(id),
            icon: LineChart
          }));
        }
        // New format with full objects
        return favoriteIds.map((fav: any) => ({
          ...fav,
          icon: LineChart // Always use LineChart as default icon
        }));
      }
    }
    return [];
  } catch (error) {
    console.error("Error getting favorite reports:", error);
    return [];
  }
};

export const saveFavoriteReports = (favorites: FavoriteReport[]): void => {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    // Dispatch a custom event to notify other components
    window.dispatchEvent(new CustomEvent('favoritesChanged', { detail: favorites }));
  } catch (error) {
    console.error("Error saving favorite reports:", error);
  }
};

export const addFavoriteReport = (report: Omit<FavoriteReport, 'icon'>): void => {
  const currentFavorites = getFavoriteReports();
  const reportWithIcon = { ...report, icon: LineChart };
  
  // Check if already exists
  if (!currentFavorites.some(fav => fav.id === report.id)) {
    const updatedFavorites = [...currentFavorites, reportWithIcon];
    saveFavoriteReports(updatedFavorites);
  }
};

export const removeFavoriteReport = (reportId: string): void => {
  const currentFavorites = getFavoriteReports();
  const updatedFavorites = currentFavorites.filter(fav => fav.id !== reportId);
  saveFavoriteReports(updatedFavorites);
};

export const toggleFavoriteReport = (report: Omit<FavoriteReport, 'icon'>): boolean => {
  const currentFavorites = getFavoriteReports();
  const exists = currentFavorites.some(fav => fav.id === report.id);
  
  if (exists) {
    removeFavoriteReport(report.id);
    return false; // Removed
  } else {
    addFavoriteReport(report);
    return true; // Added
  }
};

export const isFavoriteReport = (reportId: string): boolean => {
  const currentFavorites = getFavoriteReports();
  return currentFavorites.some(fav => fav.id === reportId);
};

// Helper functions to map report IDs to names and paths (for backward compatibility)
const getReportNameFromId = (id: string): string => {
  const reportMap: Record<string, string> = {
    'firm-activity-dashboard': 'Firm Activity Dashboard',
    'age-demographics': 'Age Demographics',
    'birthday-report': 'Birthday Report',
    'clients-aum-overtime': 'Book Development',
    'client-dashboard': 'Client Inception Report',
    'client-segmentation': 'Client Segmentation Report',
    'geographic-footprint': 'Geographic Footprint',
    'net-new-assets': 'Net New Assets',
    'referral-analytics': 'Referral Analytics',
    // 'revenue-vs-expense': 'Revenue vs Client Expense'
  };
  return reportMap[id] || id;
};

const getReportPathFromId = (id: string): string => {
  return `/reporting/${id}`;
}; 