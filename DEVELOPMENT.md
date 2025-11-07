# Development Guide & Troubleshooting

## 🛠️ Development Setup

### Requirements

- Node.js 18+
- npm or yarn
- Git
- Code editor (VS Code recommended)

### VS Code Extensions Recommended

```
- TypeScript Vue Plugin
- Prettier - Code formatter
- ESLint
- REST Client (for testing API)
```

### Initial Setup

```bash
# Clone or navigate to project
cd api-wedding

# Install dependencies
npm install

# Create environment file
cp .env.example .dev.vars

# Edit .dev.vars with your values
nano .dev.vars

# Start development server
npm run dev
```

## 📝 Development Workflow

### 1. Making Code Changes

```bash
# Make changes to src/
# TypeScript will check for errors automatically
# Server auto-reloads

# Type check
npm run type-check

# Lint code
npm run lint
```

### 2. Testing Changes

Use REST Client extension or curl:

```bash
# Test endpoint
curl http://localhost:8787/health
```

### 3. Before Committing

```bash
npm run type-check
npm run lint
npm run build
```

## 🐛 Common Issues & Solutions

### Issue 1: "Cannot find module" errors

**Symptoms:**

```
Cannot find module 'hono' or its corresponding type declarations.
```

**Solution:**

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Type check
npm run type-check
```

### Issue 2: Supabase Connection Failed

**Symptoms:**

```
Error: Failed to create user
```

**Solution:**

1. Verify `.dev.vars` exists in root directory
2. Check SUPABASE_URL format: `https://your-project.supabase.co`
3. Verify SUPABASE_KEY is correct (anon/public key)
4. Ensure Supabase project is active

```bash
# Test connection
curl https://your-project.supabase.co/rest/v1/
```

### Issue 3: JWT Token Errors

**Symptoms:**

```
Invalid or expired token
```

**Solution:**

1. Generate new JWT_SECRET
   ```bash
   openssl rand -base64 32
   ```
2. Update in `.dev.vars`
3. Restart dev server
4. Clear browser localStorage

### Issue 4: CORS Errors in Browser

**Symptoms:**

```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Solution 1**: Update CORS in `src/index.ts`:

```typescript
app.use(
  cors({
    origin: ["http://localhost:3000", "https://yourdomain.com"],
    allowMethods: ["GET", "POST", "PUT", "DELETE"],
  })
);
```

**Solution 2**: Use a CORS proxy for development:

```javascript
const API_URL = "https://cors-anywhere.herokuapp.com/http://localhost:8787";
```

### Issue 5: Database Migrations Not Applied

**Symptoms:**

```
relation "users" does not exist
```

**Solution:**

1. Go to Supabase Dashboard → SQL Editor
2. Create new query
3. Copy entire `migrations/001_init.sql`
4. Run the query
5. Check for errors in response

### Issue 6: Wrangler Deploy Fails

**Symptoms:**

```
Authentication failed
```

**Solution:**

```bash
# Logout and re-authenticate
wrangler logout
wrangler login

# Verify you're logged in
wrangler whoami
```

### Issue 7: QR Code Generation Error

**Symptoms:**

```
Failed to generate QR code
```

**Solution:**

1. Ensure qrcode library is installed
2. Check data isn't too large
3. Try with simpler data structure
4. Check browser console for specific error

### Issue 8: Rate Limiting / Too Many Requests

**Symptoms:**

```
429 Too Many Requests
```

**Solution:**

1. Check Cloudflare rate limiting (if deployed)
2. Implement exponential backoff in client
3. Check for infinite loops in code
4. Wait before retrying

## 🔍 Debugging Tips

### 1. Enable Verbose Logging

```typescript
// In src/index.ts
app.use(logger());

// In routes, add console logs
console.log("Request body:", body);
console.log("User:", user);
```

### 2. Check Local Storage (Browser)

```javascript
// In browser console
localStorage.getItem("token");
localStorage.removeItem("token"); // Clear token
```

### 3. Inspect Network Requests

**VS Code REST Client** (`test.http` file):

```
### Register
POST http://localhost:8787/api/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "Test123!",
  "name": "Test User"
}

### Get health
GET http://localhost:8787/health
```

**Browser DevTools:**

- F12 → Network tab
- Filter by XHR/Fetch
- Check request/response headers
- Check response status codes

### 4. Debug Database Queries

```typescript
// In Supabase SQL Editor
SELECT * FROM users;
SELECT * FROM invitations;
SELECT * FROM confirmations;
```

### 5. Test JWT Tokens

```javascript
// Decode JWT (no verification, just inspect)
function parseJwt(token) {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );
  return JSON.parse(jsonPayload);
}

// Usage
const token = localStorage.getItem("token");
console.log(parseJwt(token));
```

## 📊 Performance Optimization

### 1. Database Query Optimization

```typescript
// GOOD - Use select to limit fields
const { data } = await supabase
  .from("invitations")
  .select("id, invitation_code, groom_name, bride_name")
  .eq("user_id", userId);

// AVOID - Select all fields
const { data } = await supabase
  .from("invitations")
  .select("*")
  .eq("user_id", userId);
```

### 2. Connection Pooling

Supabase handles this automatically. No action needed.

### 3. Caching with KV (Optional)

```typescript
// Cache invitation by code
const cached = await CACHE.get(`inv:${code}`);
if (!cached) {
  const result = await supabase
    .from("invitations")
    .select("*")
    .eq("invitation_code", code);
  await CACHE.put(`inv:${code}`, JSON.stringify(result.data[0]), {
    expirationTtl: 3600,
  });
}
```

### 4. QR Code Optimization

```typescript
// Cache QR code to avoid regeneration
const cachedQR = await CACHE.get(`qr:${confirmationCode}`);
if (cachedQR) {
  return cachedQR;
}

const qrCode = await generateQRCodeDataUrl(data);
await CACHE.put(`qr:${confirmationCode}`, qrCode, { expirationTtl: 86400 });
```

## 🧪 Testing

### Manual Testing Checklist

```
[ ] User registration
[ ] User login
[ ] Get current user
[ ] Create invitation
[ ] Get invitation by code
[ ] List invitations
[ ] Update invitation
[ ] Delete invitation
[ ] Confirm attendance
[ ] Get confirmations
[ ] Update confirmation
[ ] Delete confirmation
```

### Load Testing

```bash
# Install Apache Bench
brew install httpd

# Test endpoint with 1000 requests
ab -n 1000 -c 10 http://localhost:8787/health
```

### Security Testing

```bash
# Test with invalid token
curl -H "Authorization: Bearer invalid" \
  http://localhost:8787/api/invitations

# Expected: 401 Unauthorized
```

## 📚 Code Structure Best Practices

### File Organization

```
src/
├── index.ts           # Main app
├── lib/              # Utilities
│   ├── supabase.ts   # One purpose
│   ├── jwt.ts        # One purpose
│   ├── qr.ts         # One purpose
│   └── utils.ts      # One purpose
├── routes/           # Route handlers
├── types/            # TypeScript types
└── middleware/       # Custom middleware (if needed)
```

### Naming Conventions

```typescript
// Variables
const maxGuests = 100;

// Functions
function generateInvitationCode() {}
async function createInvitation() {}

// Types/Interfaces
interface User {}
type InvitationCode = string;

// Constants
const JWT_EXPIRATION = 24 * 60 * 60;

// Private functions (if needed)
function _hashPassword() {}
```

### Error Handling

```typescript
// Good
try {
  const data = await operation();
  return c.json({ data });
} catch (error) {
  console.error("Operation failed:", error);
  return c.json({ error: "Operation failed" }, 500);
}

// Bad
try {
  const data = await operation();
  return c.json({ data });
} catch (error) {
  return c.json({ error }, 500); // Don't expose full error
}
```

## 🚀 Production Checklist

Before deploying:

- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Environment variables set in Cloudflare
- [ ] CORS configured for production domain
- [ ] JWT secret is strong (32+ characters)
- [ ] Database backups enabled
- [ ] Error logging configured
- [ ] Rate limiting implemented
- [ ] HTTPS/TLS enabled
- [ ] Database indexes verified
- [ ] RLS policies tested

## 📖 Useful References

### Code Examples

**Create a new endpoint:**

```typescript
// src/routes/newfeature.ts
import { Hono } from "hono";

const feature = new Hono<{ Bindings: CloudflareEnv }>();

feature.get("/", async (c) => {
  return c.json({ message: "Hello" });
});

export default feature;
```

**Add to main app:**

```typescript
// src/index.ts
import featureRoutes from "./routes/newfeature";
app.route("/api/feature", featureRoutes);
```

**Add middleware:**

```typescript
app.use(async (c, next) => {
  console.log(`${c.req.method} ${c.req.path}`);
  await next();
});
```

### Documentation Links

- Hono: https://hono.dev/api/
- Cloudflare Workers: https://developers.cloudflare.com/workers/
- Supabase: https://supabase.com/docs
- TypeScript: https://www.typescriptlang.org/docs/

## 💡 Tips & Tricks

### 1. Quick Testing with VS Code REST Client

Install "REST Client" extension, create `test.http`:

```
@baseUrl = http://localhost:8787
@token = YOUR_TOKEN_HERE

### Health check
GET {{baseUrl}}/health

### Register
POST {{baseUrl}}/api/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "Test123!",
  "name": "Test"
}
```

### 2. Generate Test Data

```typescript
function generateTestInvitation() {
  return {
    groom_name: "John",
    bride_name: "Jane",
    ceremony_date: new Date().toISOString().split("T")[0],
    ceremony_time: "18:00",
    location: "Test Venue",
    max_guests: 100,
  };
}
```

### 3. Monitor Real-time Logs

```bash
# Continuous logs from Cloudflare
wrangler tail --format pretty
```

### 4. Local Database Inspection

In Supabase Dashboard:

- Go to SQL Editor
- Run queries directly
- View real-time data

### 5. Environment Variable Best Practices

**Local (.dev.vars):**

```
SUPABASE_URL=https://dev-project.supabase.co
SUPABASE_KEY=dev-key
JWT_SECRET=dev-secret
API_DOMAIN=http://localhost:8787
```

**Production (Cloudflare Secrets):**

```bash
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_KEY
wrangler secret put JWT_SECRET
```

## 🎓 Learning Resources

### TypeScript

- Official: https://www.typescriptlang.org/
- Cheat Sheet: https://www.typescriptlang.org/cheatsheets

### Web APIs

- MDN Web Docs: https://developer.mozilla.org/
- Web Crypto: https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API

### REST API Design

- RESTful API Design: https://restfulapi.net/
- JSON API: https://jsonapi.org/

## 🆘 Getting Help

1. Check TROUBLESHOOTING section above
2. Review relevant documentation file
3. Search GitHub issues
4. Check Stack Overflow with specific error message
5. Ask in community forums

---

Happy developing! 🚀
