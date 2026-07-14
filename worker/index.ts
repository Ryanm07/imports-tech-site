/** Cloudflare Worker entry point for the vinext-starter template. */
import {
  handleImageOptimization,
  DEFAULT_DEVICE_SIZES,
  DEFAULT_IMAGE_SIZES,
} from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS?: Fetcher;
  DB: D1Database;
  YOUTUBE_API_KEY?: string;
  YOUTUBE_CHANNEL_ID?: string;
  IMAGES?: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: {
          format: string;
          quality: number;
        }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/_vinext/image") {
      const intrinsicAssetWidths = [44, 58, 1546, 2120];
      const allowedWidths = [
        ...new Set([
          ...DEFAULT_DEVICE_SIZES,
          ...DEFAULT_IMAGE_SIZES,
          ...intrinsicAssetWidths,
        ]),
      ];
      const imageResponse = await handleImageOptimization(
        request,
        {
          fetchAsset: (path) => {
            const assetRequest = new Request(new URL(path, request.url));
            return env.ASSETS
              ? env.ASSETS.fetch(assetRequest)
              : fetch(assetRequest);
          },
          ...(env.IMAGES
            ? {
                transformImage: async (
                  body: ReadableStream,
                  {
                    width,
                    format,
                    quality,
                  }: { width: number; format: string; quality: number },
                ) => {
                  const result = await env
                    .IMAGES!.input(body)
                    .transform(width > 0 ? { width } : {})
                    .output({ format, quality });
                  return result.response();
                },
              }
            : {}),
        },
        allowedWidths,
      );
      return withSecurityHeaders(imageResponse, url);
    }

    const response = await handler.fetch(request, env, ctx);
    return withSecurityHeaders(response, url);
  },
  async scheduled(
    controller: { cron: string; scheduledTime: number },
    env: Env,
    ctx: ExecutionContext,
  ) {
    const mode = controller.cron === "15 3 * * *" ? "full" : "incremental";
    ctx.waitUntil(
      import("../lib/youtube-service").then(({ runYouTubeSync }) =>
        runYouTubeSync({
          trigger: "cron",
          mode,
          apiKey: env.YOUTUBE_API_KEY,
          channelId: env.YOUTUBE_CHANNEL_ID,
          now: new Date(controller.scheduledTime),
        }),
      ),
    );
  },
};

function withSecurityHeaders(response: Response, url: URL) {
  const secured = new Response(response.body, response);
  secured.headers.set("X-Content-Type-Options", "nosniff");
  secured.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  secured.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  );
  secured.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "form-action 'self'",
      "frame-ancestors 'self' https://chatgpt.com https://*.chatgpt.com",
      "frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com https://challenges.cloudflare.com",
      "img-src 'self' data: blob: https://i.ytimg.com",
      "media-src 'self' https://www.youtube.com",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
      "connect-src 'self' https://challenges.cloudflare.com",
      "upgrade-insecure-requests",
    ].join("; "),
  );
  if (url.protocol === "https:") {
    secured.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
  }
  return secured;
}

export default worker;
