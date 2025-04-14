/**
 * Format a role name for display (e.g., "global_admin" -> "Global Admin")
 */
export const formatRoleName = (roleName) => {
  return roleName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Format a status string for display (e.g., "active" -> "Active")
 */
export const formatStatus = (status) => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

/**
 * Format roles data for use in select inputs
 */
export const formatRolesForSelect = (roles) => {
  return roles ? roles.map(role => ({
    value: role.name,
    label: formatRoleName(role.name),
    id: role.id
  })) : [];
};

/**
 * Format statuses data for use in select inputs
 */
export const formatStatusesForSelect = (statuses) => {
  return statuses ? statuses.map(status => ({
    value: status,
    label: formatStatus(status)
  })) : [];
};