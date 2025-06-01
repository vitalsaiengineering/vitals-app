/**
 * Format a role name for display (e.g., "global_admin" -> "Global Admin")
 */
export const formatRoleName = (roleName: string): string => {
  return roleName
    .split('_')
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Format a status string for display (e.g., "active" -> "Active")
 */
export const formatStatus = (status: string): string => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

/**
 * Format roles data for use in select inputs
 */
export const formatRolesForSelect = (roles: any[]): Array<{value: string, label: string, id: number}> => {
  return roles ? roles.map((role: any) => ({
    value: role.name,
    label: formatRoleName(role.name),
    id: role.id
  })) : [];
};

/**
 * Format statuses data for use in select inputs
 */
export const formatStatusesForSelect = (statuses: any): Array<{value: string, label: string}> => {
  // Ensure statuses is an array before attempting to map
  if (!statuses || !Array.isArray(statuses)) {
    console.warn('formatStatusesForSelect: statuses is not an array:', statuses);
    return [];
  }
  
  return statuses.map((status: string) => ({
    value: status,
    label: formatStatus(status)
  }));
};