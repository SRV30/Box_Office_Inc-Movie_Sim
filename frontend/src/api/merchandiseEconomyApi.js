import apiClient from "./apiClient";

export const getStudioProducts = async () => {
  const response = await apiClient.get("/merchandise-economy");
  return response.data;
};

export const getEligibleIPs = async () => {
  const response = await apiClient.get("/merchandise-economy/eligible-ip");
  return response.data;
};

export const launchProductLine = async (data) => {
  const response = await apiClient.post("/merchandise-economy/launch", data);
  return response.data;
};

export const restockProductInventory = async (id, data) => {
  const response = await apiClient.post(`/merchandise-economy/${id}/restock`, data);
  return response.data;
};

export const updateProductPricing = async (id, data) => {
  const response = await apiClient.put(`/merchandise-economy/${id}/pricing`, data);
  return response.data;
};

export const liquidateStock = async (id) => {
  const response = await apiClient.post(`/merchandise-economy/${id}/liquidate`);
  return response.data;
};
