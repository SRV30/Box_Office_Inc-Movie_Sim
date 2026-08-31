import apiClient from "./apiClient";

export const getStudioUniverses = async () => {
  const response = await apiClient.get("/franchise-v2");
  return response.data;
};

export const getUniverseById = async (id) => {
  const response = await apiClient.get(`/franchise-v2/${id}`);
  return response.data;
};

export const createUniverse = async (data) => {
  const response = await apiClient.post("/franchise-v2", data);
  return response.data;
};

export const addCanonEntry = async (id, data) => {
  const response = await apiClient.post(`/franchise-v2/${id}/entries`, data);
  return response.data;
};

export const toggleHiatus = async (id) => {
  const response = await apiClient.post(`/franchise-v2/${id}/hiatus`);
  return response.data;
};
