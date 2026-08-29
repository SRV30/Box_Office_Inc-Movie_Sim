import apiClient from "./apiClient";

export const getTVShows = async () => {
  const response = await apiClient.get("/tv-shows");
  return response.data;
};

export const getTVShowById = async (id) => {
  const response = await apiClient.get(`/tv-shows/${id}`);
  return response.data;
};

export const createTVShow = async (data) => {
  const response = await apiClient.post("/tv-shows", data);
  return response.data;
};

export const renewTVShowSeason = async (id, data) => {
  const response = await apiClient.post(`/tv-shows/${id}/renew`, data);
  return response.data;
};

export const syndicateTVShow = async (id) => {
  const response = await apiClient.post(`/tv-shows/${id}/syndicate`);
  return response.data;
};

export const checkTalentTVConflict = async (talentId) => {
  const response = await apiClient.get(`/tv-shows/check-conflict/${talentId}`);
  return response.data;
};
