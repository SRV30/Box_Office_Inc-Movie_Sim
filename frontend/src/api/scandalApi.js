import apiClient from "./apiClient";

export const getStudioScandals = async () => {
  const response = await apiClient.get("/scandals");
  return response.data;
};

export const getActiveScandals = async () => {
  const response = await apiClient.get("/scandals/active");
  return response.data;
};

export const getAvailableStrategies = async () => {
  const response = await apiClient.get("/scandals/strategies");
  return response.data;
};

export const triggerScandal = async (data) => {
  const response = await apiClient.post("/scandals/trigger", data);
  return response.data;
};

export const respondToScandal = async (scandalId, strategyKey) => {
  const response = await apiClient.post(`/scandals/${scandalId}/respond`, {
    strategyKey,
  });
  return response.data;
};

export const getMovieScandalImpact = async (movieId) => {
  const response = await apiClient.get(`/scandals/impact/movie/${movieId}`);
  return response.data;
};
