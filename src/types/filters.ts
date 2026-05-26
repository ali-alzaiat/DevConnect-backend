export interface BaseListingFilter {
  // Pagination
  page?: number;
  limit?: number;

  // Sorting
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';

  // Global Text Search
  searchTerm?: string;
}
