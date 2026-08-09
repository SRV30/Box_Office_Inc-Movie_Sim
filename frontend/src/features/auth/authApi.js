import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000/api' }),
  endpoints: (builder) => ({
    googleLogin: builder.mutation({
      query: (data) => ({
        url: '/auth/google', 
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const { useGoogleLoginMutation } = authApi;