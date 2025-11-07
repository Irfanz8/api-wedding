# Deployment Guide

## Cloudflare Workers Deployment

### Prerequisites

- Cloudflare account (https://cloudflare.com)
- Domain registered (can use free Cloudflare workers.dev subdomain)
- Node.js 18+

### Step 1: Install Wrangler CLI

```bash
npm install -D wrangler
# or globally
npm install -g wrangler
```

### Step 2: Authenticate with Cloudflare

```bash
wrangler login
```

This will open a browser to authorize Cloudflare access.

### Step 3: Update wrangler.toml

Update the configuration file with your details:

```toml
name = "wedding-invitation-api"
main = "src/index.ts"
compatibility_date = "2024-11-06"
account_id = "your-account-id"  # Get from Cloudflare dashboard

# For custom domain
routes = [
  { pattern = "api.yourdomain.com/*", zone_name = "yourdomain.com" }
]

# KV Namespace for caching (optional)
[[kv_namespaces]]
binding = "CACHE"
id = "your-kv-id"
```

### Step 4: Add Secrets

Store sensitive data securely:

```bash
wrangler secret put SUPABASE_URL
# Paste: https://your-project.supabase.co

wrangler secret put SUPABASE_KEY
# Paste: your-anon-public-key

wrangler secret put JWT_SECRET
# Paste: your-generated-secret (openssl rand -base64 32)
```

### Step 5: Build and Deploy

```bash
npm run build
npm run deploy
```

Or use Wrangler directly:

```bash
wrangler publish
```

### Step 6: Verify Deployment

```bash
curl https://your-worker.workers.dev/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2024-11-06T10:00:00.000Z"
}
```

## Environment Variables

### Development (.dev.vars)

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-public-key
JWT_SECRET=your-jwt-secret-key
API_DOMAIN=http://localhost:8787
```

### Production (Cloudflare Secrets)

Use `wrangler secret put` for production values - they won't be stored in wrangler.toml.

## Domain Setup

### Using workers.dev Subdomain (Free)

Your API will be available at: `https://your-worker-name.workers.dev`

### Using Custom Domain

1. In Cloudflare Dashboard → Workers → Your Worker
2. Click "Settings" → "Triggers" → "Routes"
3. Add route: `api.yourdomain.com/*`
4. Zone: select your Cloudflare-managed domain

## Monitoring and Logs

### View Logs

```bash
wrangler tail
```

### Real-time Debugging

```bash
wrangler tail --format pretty
```

## Performance Optimization

### 1. Enable Cloudflare Cache

Add cache headers to wrangler.toml:

```toml
[env.production]
routes = [
  { pattern = "api.yourdomain.com/*", zone_name = "yourdomain.com" }
]
```

### 2. Use KV for QR Code Caching

Store generated QR codes:

```typescript
const cached = await CACHE.get(`qr:${code}`);
if (!cached) {
  const qr = await generateQRCodeDataUrl(data);
  await CACHE.put(`qr:${code}`, qr, { expirationTtl: 86400 });
}
```

### 3. Optimize Bundle Size

- Remove unused dependencies
- Use tree-shaking: `"sideEffects": false` in package.json
- Minify with esbuild

## Database Backups

### Supabase Automatic Backups

Supabase provides automatic daily backups. To enable:

1. Go to Supabase Dashboard → Settings → Backups
2. Enable backups (included in Pro plan)

### Manual Backup

```bash
pg_dump "postgresql://user:password@host:port/database" > backup.sql
```

### Restore from Backup

```sql
-- In Supabase SQL Editor
\i backup.sql
```

## Security Best Practices

1. **Rotate JWT Secret Regularly**

   ```bash
   wrangler secret put JWT_SECRET
   # Generate new secret
   openssl rand -base64 32
   ```

2. **Enable CORS Only for Known Domains**

   ```typescript
   app.use(
     cors({
       origin: "https://yourdomain.com",
       credentials: true,
     })
   );
   ```

3. **Rate Limiting**

   - Add rate limiting middleware for production
   - Use Cloudflare Rate Limiting (Pro plan required)

4. **API Key Protection**

   - Store Supabase key with minimal permissions
   - Consider using service role key for backend operations
   - Create separate read-only keys if needed

5. **Enable Supabase RLS**
   - Policies defined in `migrations/001_init.sql`
   - Prevent unauthorized access at database level

## Scaling

### Database

- Supabase scales automatically
- Monitor database size and connection limits
- Consider upgrading to Pro plan for higher limits

### Workers

- Cloudflare Workers auto-scales
- Max request size: 100 MB
- Max CPU time: 30 seconds (per request)
- For long operations, use durable objects or queue

### Caching

- Use Cloudflare Cache (Workers KV)
- Cache API responses and QR codes
- Set appropriate TTL (time-to-live)

## Troubleshooting Deployment

### "401 Unauthorized"

Check credentials:

```bash
wrangler whoami
```

Re-authenticate if needed:

```bash
wrangler logout
wrangler login
```

### "Module not found"

Ensure all dependencies are in package.json:

```bash
npm list
npm install
```

### "Timeout errors"

- Check database connection
- Verify Supabase project is active
- Check network logs: `wrangler tail`

### "CORS errors"

Add client domain to CORS:

```typescript
app.use(
  cors({
    origin: ["https://yourdomain.com", "https://app.yourdomain.com"],
    allowMethods: ["GET", "POST", "PUT", "DELETE"],
  })
);
```

## Monitoring

### Key Metrics to Monitor

1. **Request Rate**: Number of requests per minute
2. **Error Rate**: Percentage of failed requests
3. **Response Time**: Average request latency
4. **Database Connections**: Active connections to Supabase

### Tools

- Supabase Dashboard: https://app.supabase.com
- Cloudflare Dashboard: https://dash.cloudflare.com
- Wrangler Logs: `wrangler tail`

## Cost Estimation

### Cloudflare Workers

- **Free Tier**: 100,000 requests/day
- **Paid**: $5/month + $0.50 per million requests

### Supabase

- **Free Tier**: 500 MB storage, 2 GB bandwidth
- **Pro**: $25/month + overage charges

### Total (Estimated)

- Small project (< 10K requests/day): $25/month
- Medium project: $50-100/month
- Large project: $200+/month

## CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm install
      - run: npm run build
      - name: Deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        run: npm run deploy
```

## Rollback

If deployment fails or has issues:

```bash
# View deployment history
wrangler deployments list

# Rollback to previous version
wrangler rollback --message "Rollback to previous version"
```

## Support

For issues:

- Check Cloudflare documentation: https://developers.cloudflare.com/workers/
- Supabase docs: https://supabase.com/docs
- Wrangler docs: https://developers.cloudflare.com/workers/wrangler/
