import {api} from './authApi';
import type  {
  CollectionResponse,
  CreateCollectionRequest
} from '../types';

export const collectionApi = {
  getAll: async (): Promise<CollectionResponse[]> => {
    const response = await api.get<CollectionResponse[]>('/collection');
    return response.data;
  },

  create: async (
    data: CreateCollectionRequest
  ): Promise<CollectionResponse> => {
    const response = await api.post<CollectionResponse>(
      '/collection', data);
    return response.data;
  },

  addDocument: async (
    collectionId: string,
    documentId: string
  ): Promise<void> => {
    await api.post(`/collection/${collectionId}/documents`,
      { documentId });
  },

  removeDocument: async (
    collectionId: string,
    documentId: string
  ): Promise<void> => {
    await api.delete(
      `/collection/${collectionId}/documents/${documentId}`);
  },

  delete: async (collectionId: string): Promise<void> => {
    await api.delete(`/collection/${collectionId}`);
  }
};