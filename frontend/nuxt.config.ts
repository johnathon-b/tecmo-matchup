export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      apiUrl: process.env.API_URL || 'http://localhost:8787'
    }
  },
  css: [
    '~/assets/css/main.css'
  ],
  modules: ['@nuxtjs/tailwindcss'],
  tailwindcss: {
    // You can add options if needed
  },
  compatibilityDate: '2025-03-30'
})