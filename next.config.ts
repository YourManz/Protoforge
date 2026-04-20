import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/Protoforge',
  images: { unoptimized: true },
  trailingSlash: true,
}

export default nextConfig
