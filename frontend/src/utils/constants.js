export const CATEGORIES = [
  { value: 'PLUMBING', label: 'Plumbing' },
  { value: 'ELECTRICAL', label: 'Electrical' },
  { value: 'CLEANING', label: 'Cleaning' },
  { value: 'SECURITY', label: 'Security' },
  { value: 'LIFT', label: 'Lift' },
  { value: 'PARKING', label: 'Parking' },
  { value: 'CIVIL_STRUCTURAL', label: 'Civil / Structural' },
  { value: 'PEST_CONTROL', label: 'Pest Control' },
  { value: 'OTHER', label: 'Other' },
];

export const STATUSES = [
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED', label: 'Resolved' },
];

export const PRIORITIES = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
];

export const categoryLabel = (value) => CATEGORIES.find((c) => c.value === value)?.label || value;
export const statusLabel = (value) => STATUSES.find((s) => s.value === value)?.label || value;
export const priorityLabel = (value) => PRIORITIES.find((p) => p.value === value)?.label || value;
