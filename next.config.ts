import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Open the dev server from other devices on the LAN (phone, another PC), e.g. http://192.168.88.114:3000.
  allowedDevOrigins: ["192.168.*.*"],
  experimental: {
    agentFeedback: true,
    serverActions: {
      // Support-request attachments: up to 10MB of files plus the form fields and
      // multipart overhead. Keep nginx's client_max_body_size (deploy/) in step.
      bodySizeLimit: "11mb",
    },
  },
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;
