import { execSync } from 'node:child_process'

/**
 * Run database migrations before starting the server when MIGRATE=true.
 * Migration locking ensures that if multiple containers boot at once, only
 * one runs migrations while the others wait.
 */
if (process.env.MIGRATE === 'true') {
  console.log('Running migrations...')
  execSync('node ace migration:run --force', { stdio: 'inherit' })
}

/**
 * Start the HTTP server.
 */
console.log('Starting server...')
await import('./bin/server.js')
