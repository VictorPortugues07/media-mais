import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowLocalIP: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  async headers() {
    return [
      {
        // Uploads têm nome único (UUID) e nunca são sobrescritos: podem ficar em cache
        // no navegador/TV indefinidamente, evitando baixar o mesmo vídeo a cada ciclo do player.
        source: "/uploads/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
