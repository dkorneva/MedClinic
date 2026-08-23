import { apiClient } from './client';

export interface Category {
  id: number;
  name: string;
  doctorSpecialty: string;
  price: number;
  isActive: boolean;
}

export interface CreateCategoryRequest {
  name: string;
  doctorSpecialty: string;
  price: number;
}

export interface UpdateCategoryRequest {
  name: string;
  doctorSpecialty: string;
  price: number;
}

export interface SetCategoryActiveRequest {
  isActive: boolean;
}

export function getCategories(includeInactive = false) {
  const query = includeInactive ? '?includeInactive=true' : '';
  return apiClient.get<Category[]>(`/api/categories${query}`);
}

export function createCategory(request: CreateCategoryRequest) {
  return apiClient.post<Category>('/api/categories', request);
}

export function updateCategory(id: number, request: UpdateCategoryRequest) {
  return apiClient.put<Category>(`/api/categories/${id}`, request);
}

export function setCategoryActive(id: number, request: SetCategoryActiveRequest) {
  return apiClient.patch<Category>(`/api/categories/${id}/active`, request);
}

export const categoriesApi = {
  list: getCategories,
  create: createCategory,
  update: updateCategory,
  setActive: setCategoryActive,
};
