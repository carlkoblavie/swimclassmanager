import { createHmac, createHash } from 'node:crypto'
import { mkdir, readFile, stat, unlink } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname } from 'node:path'
import { BaseCommand } from '@adonisjs/core/ace'
import app from '@adonisjs/core/services/app'

const require = createRequire(import.meta.url)
const Database = require('better-sqlite3') as {
  new (
    path: string,
    options?: { readonly?: boolean; fileMustExist?: boolean }
  ): {
    backup(path: string): Promise<void>
    close(): void
  }
}

type R2Config = {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  prefix: string
}

export default class BackupSqlite extends BaseCommand {
  static commandName = 'backup:sqlite'
  static description = 'Back up the SQLite database to Cloudflare R2'

  async run() {
    const sourcePath = process.env.SQLITE_BACKUP_SOURCE_PATH ?? app.tmpPath('db.sqlite3')
    const backupPath = app.tmpPath('backups', `db-${this.timestamp()}.sqlite3`)
    const config = this.readR2Config()

    await mkdir(dirname(backupPath), { recursive: true })
    await this.createSqliteBackup(sourcePath, backupPath)

    try {
      const body = await readFile(backupPath)
      const key = `${config.prefix}/${backupPath.split('/').pop()}`
      await this.uploadToR2(config, key, body)

      const size = await stat(backupPath)
      this.logger.success(`Uploaded SQLite backup to r2://${config.bucket}/${key}`)
      this.logger.info(`Backup size: ${size.size} bytes`)
    } finally {
      await unlink(backupPath).catch(() => {})
    }
  }

  private async createSqliteBackup(sourcePath: string, backupPath: string) {
    const database = new Database(sourcePath, { readonly: true, fileMustExist: true })
    try {
      await database.backup(backupPath)
    } finally {
      database.close()
    }
  }

  private readR2Config(): R2Config {
    return {
      accountId: this.requiredEnv('CLOUDFLARE_R2_ACCOUNT_ID'),
      accessKeyId: this.requiredEnv('CLOUDFLARE_R2_ACCESS_KEY_ID'),
      secretAccessKey: this.requiredEnv('CLOUDFLARE_R2_SECRET_ACCESS_KEY'),
      bucket: this.requiredEnv('CLOUDFLARE_R2_BUCKET'),
      prefix: process.env.CLOUDFLARE_R2_BACKUP_PREFIX ?? 'swimclassmanager/sqlite',
    }
  }

  private requiredEnv(name: string) {
    const value = process.env[name]
    if (!value) {
      throw new Error(`${name} is required to back up SQLite to Cloudflare R2.`)
    }

    return value
  }

  private async uploadToR2(config: R2Config, key: string, body: Buffer) {
    const host = `${config.accountId}.r2.cloudflarestorage.com`
    const pathname = `/${config.bucket}/${this.encodeObjectKey(key)}`
    const url = `https://${host}${pathname}`
    const now = new Date()
    const amzDate = this.amzDate(now)
    const dateStamp = amzDate.slice(0, 8)
    const payloadHash = createHash('sha256').update(body).digest('hex')
    const signedHeaders = 'host;x-amz-content-sha256;x-amz-date'

    const canonicalHeaders = [
      `host:${host}`,
      `x-amz-content-sha256:${payloadHash}`,
      `x-amz-date:${amzDate}`,
      '',
    ].join('\n')

    const canonicalRequest = [
      'PUT',
      pathname,
      '',
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join('\n')

    const credentialScope = `${dateStamp}/auto/s3/aws4_request`
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      createHash('sha256').update(canonicalRequest).digest('hex'),
    ].join('\n')

    const signature = createHmac('sha256', this.signingKey(config.secretAccessKey, dateStamp))
      .update(stringToSign)
      .digest('hex')

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': [
          `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}`,
          `SignedHeaders=${signedHeaders}`,
          `Signature=${signature}`,
        ].join(', '),
        'Content-Length': String(body.byteLength),
        'Content-Type': 'application/vnd.sqlite3',
        'x-amz-content-sha256': payloadHash,
        'x-amz-date': amzDate,
      },
      body,
    })

    if (!response.ok) {
      const responseText = await response.text()
      throw new Error(`Cloudflare R2 upload failed (${response.status}): ${responseText}`)
    }
  }

  private signingKey(secretAccessKey: string, dateStamp: string) {
    const dateKey = createHmac('sha256', `AWS4${secretAccessKey}`).update(dateStamp).digest()
    const regionKey = createHmac('sha256', dateKey).update('auto').digest()
    const serviceKey = createHmac('sha256', regionKey).update('s3').digest()
    return createHmac('sha256', serviceKey).update('aws4_request').digest()
  }

  private amzDate(date: Date) {
    return date.toISOString().replace(/[:-]|\.\d{3}/g, '')
  }

  private timestamp() {
    return new Date().toISOString().replace(/[:-]|\.\d{3}/g, '')
  }

  private encodeObjectKey(key: string) {
    return key
      .split('/')
      .map((part) => encodeURIComponent(part))
      .join('/')
  }
}
