import apiClient from "./apiClient";

export const getAllPlatforms = async () => {
  const response = await apiClient.get("/streaming-platforms");
  return response.data;
};

export const getMyPlatform = async () => {
  const response = await apiClient.get("/streaming-platforms/my-platform");
  return response.data;
};

export const launchPlayerPlatform = async (data) => {
  const response = await apiClient.post("/streaming-platforms/launch", data);
  return response.data;
};

export const updatePlatformConfig = async (id, data) => {
  const response = await apiClient.put(`/streaming-platforms/${id}/pricing`, data);
  return response.data;
};

export const licenseContentToPlatform = async (id, data) => {
  const response = await apiClient.post(`/streaming-platforms/${id}/license`, data);
  return response.data;
};

export const upgradeRecommendationTech = async (id) => {
  const response = await apiClient.post(`/streaming-platforms/${id}/upgrade-recommendations`);
  return response.data;
};
