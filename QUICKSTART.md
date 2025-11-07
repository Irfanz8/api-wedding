# Quick Start Guide

## 5-Minute Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Create `.dev.vars` File

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-public-key
JWT_SECRET=your-secret-key-here
API_DOMAIN=http://localhost:8787
```

Get these from:

- **Supabase URL**: Supabase Dashboard → Project Settings → API
- **Supabase Key**: Supabase Dashboard → Project Settings → API (anon/public key)
- **JWT Secret**: Generate with: `openssl rand -base64 32`

### 3. Setup Supabase Database

1. Go to Supabase Dashboard → SQL Editor
2. Create a new query
3. Copy and paste the content of `migrations/001_init.sql`
4. Run the query

### 4. Run Locally

```bash
npm run dev
```

Visit: `http://localhost:8787/health`

## Testing the API

### 1. Register User

```bash
curl -X POST http://localhost:8787/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!",
    "name": "Test User"
  }'
```

Save the returned `token`

### 2. Create Invitation

```bash
curl -X POST http://localhost:8787/api/invitations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "groom_name": "John",
    "bride_name": "Jane",
    "ceremony_date": "2024-12-25",
    "ceremony_time": "18:00",
    "location": "Venue Address",
    "max_guests": 100
  }'
```

Save the returned `invitation_code` (e.g., `DI121524`)

### 3. Guest Confirms

```bash
curl -X POST http://localhost:8787/api/confirmations/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "invitation_code": "DI121524",
    "guest_name": "Michael",
    "guest_email": "guest@example.com",
    "confirmed": true
  }'
```

You'll get a QR code in the response!

### 4. View Confirmations

```bash
curl -X GET http://localhost:8787/api/confirmations/invitations/{INVITATION_ID} \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Project Structure

```
src/
├── index.ts              # Main app
├── lib/
│   ├── supabase.ts       # Database connection
│   ├── jwt.ts            # Authentication
│   ├── utils.ts          # Helpers
│   └── qr.ts             # QR code generation
├── routes/
│   ├── auth.ts           # /api/auth/*
│   ├── invitations.ts    # /api/invitations/*
│   └── confirmations.ts  # /api/confirmations/*
└── types/
    └── index.ts          # TypeScript types
```

## Deployment

### Deploy to Cloudflare Workers

1. Create Cloudflare account (free tier available)
2. Install Wrangler: `npm install -g @wrangler/cli`
3. Authenticate: `wrangler login`
4. Update `wrangler.toml` with your email
5. Add secrets:
   ```bash
   wrangler secret put SUPABASE_URL
   wrangler secret put SUPABASE_KEY
   wrangler secret put JWT_SECRET
   ```
6. Deploy:
   ```bash
   npm run deploy
   ```

## Useful Commands

| Command              | Description                    |
| -------------------- | ------------------------------ |
| `npm run dev`        | Start local development server |
| `npm run deploy`     | Deploy to Cloudflare Workers   |
| `npm run build`      | Build for production           |
| `npm run type-check` | Check TypeScript types         |
| `npm run lint`       | Run ESLint                     |

## Troubleshooting

### "Cannot find module 'hono'"

```bash
rm -rf node_modules package-lock.json
npm install
```

### "Supabase connection failed"

- Check `.dev.vars` file exists and has correct values
- Verify SUPABASE_URL is correct format
- Check internet connection

### "Invalid JWT token"

- Generate a new JWT_SECRET: `openssl rand -base64 32`
- Update in `.dev.vars`
- Restart dev server

## Next Steps

1. ✅ Read [API_DOCS.md](API_DOCS.md) for detailed endpoint documentation
2. ✅ Check [README.md](README.md) for features and configuration
3. ✅ Customize database schema in `migrations/001_init.sql` if needed
4. ✅ Add email notifications for confirmations
5. ✅ Implement frontend application

## Example Frontend Integration

Get invitation by code (public):

```javascript
const response = await fetch("http://localhost:8787/api/invitations/DI121524");
const { invitation } = await response.json();
```

Confirm attendance (public):

```javascript
const response = await fetch(
  "http://localhost:8787/api/confirmations/confirm",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      invitation_code: "DI121524",
      guest_name: "Jane Doe",
      guest_email: "jane@example.com",
      confirmed: true,
    }),
  }
);
const {
  confirmation,
  confirmation: { qr_code },
} = await response.json();
// Use qr_code for displaying QR to guest
```

## Support

For issues:

1. Check error messages in console
2. Review API_DOCS.md for endpoint details
3. Verify Supabase database is setup correctly
4. Check .dev.vars environment variables

Happy coding! 🎉
