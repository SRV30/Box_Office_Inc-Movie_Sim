import apiClient from "./apiClient";

export const getMoviePerformanceReports = async ({
  page = 1,
  limit = 15,
  genre,
} = {}) => {
  const params = new URLSearchParams({ page, limit });
  if (genre) params.set("genre", genre);

  const response = await apiClient.get(
    `/analytics/movies?${params.toString()}`
  );
  return response.data;
};

export const getMovieProfitability = async (movieId) => {
  const response = await apiClient.get(
    `/analytics/movies/${movieId}/profitability`
  );
  return response.data;
};
