import app from '@adonisjs/core/services/app'
import { defineConfig } from '@adonisjs/cors'
import type { HttpContext } from '@adonisjs/core/http'

const customerSiteOrigins = ['https://swimafricaghana.com', 'https://www.swimafricaghana.com']

function isPublicCatalogRead({ request }: HttpContext) {
  const requestedMethod = request.header('Access-Control-Request-Method')
  const method = requestedMethod ?? request.method()

  return method === 'GET' && request.url().startsWith('/api/register/')
}

function isLocalPreviewOrigin(origin: string) {
  return origin === 'null' || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
}

/**
 * Configuration options to tweak the CORS policy. The following
 * options are documented on the official documentation website.
 *
 * https://docs.adonisjs.com/guides/security/cors
 */
const corsConfig = defineConfig({
  /**
   * Enable or disable CORS handling globally.
   */
  enabled: true,

  /**
   * In development, allow every origin to simplify local front/backend setup.
   * In production, allow customer websites that render the public catalog.
   * Local preview origins are allowed only for read-only public catalog routes.
   */
  origin: app.inDev
    ? true
    : (origin, ctx) => {
        if (customerSiteOrigins.includes(origin)) {
          return origin
        }

        if (isPublicCatalogRead(ctx) && isLocalPreviewOrigin(origin)) {
          return origin
        }

        return false
      },

  /**
   * HTTP methods accepted for cross-origin requests.
   */
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE'],

  /**
   * Reflect request headers by default. Use a string array to restrict
   * allowed headers.
   */
  headers: true,

  /**
   * Response headers exposed to the browser.
   */
  exposeHeaders: [],

  /**
   * Allow cookies/authorization headers on cross-origin requests.
   */
  credentials: true,

  /**
   * Cache CORS preflight response for N seconds.
   */
  maxAge: 90,
})

export default corsConfig
