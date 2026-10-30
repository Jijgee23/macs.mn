import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
