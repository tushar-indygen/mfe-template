import type { NextConfig } from "next"
import withBundleAnalyzer from "@next/bundle-analyzer"

const nextConfig: NextConfig = {
    output: "standalone",
    /* config options here */
    reactCompiler: true,
    // Expose app name to client
    env: {
        NEXT_PUBLIC_APP_NAME: JSON.parse(require('fs').readFileSync('./package.json', 'utf8')).name,
    },
    // Dynamic basePath from env
    basePath: process.env.BASE_PATH || "",
    assetPrefix: process.env.ASSET_PREFIX || undefined,
    async headers() {
        return [
            {
                source: "/:path*",
                headers: [
                    {
                        key: "x-mfe-zone",
                        value: process.env.BASE_PATH || "root",
                    },
                ],
            },
        ];
    },
}

const bundleAnalyzer = withBundleAnalyzer({
    enabled: process.env.ANALYZE === "true",
    openAnalyzer: false,
})

export default bundleAnalyzer(nextConfig)
