/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    // `gcloud run services proxy` serves the app at localhost:8080 but forwards
    // the Cloud Run hostname, so Next's Server Actions origin check rejects
    // every login. Allow the local proxy origin explicitly.
    serverActions: {
      allowedOrigins: ['localhost:8080', '127.0.0.1:8080'],
    },
  },
};

export default nextConfig;
