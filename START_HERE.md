# 🎉 START HERE - Wedding Invitation API

Welcome! Your complete wedding invitation API has been created and is ready to use.

## ⚡ Quick Navigation

### 🚀 I Want to...
- **Get started in 5 minutes** → Read [`QUICKSTART.md`](QUICKSTART.md)
- **Understand the full project** → Read [`README.md`](README.md)
- **See all API endpoints** → Read [`API_DOCS.md`](API_DOCS.md)
- **Deploy to production** → Read [`DEPLOYMENT.md`](DEPLOYMENT.md)
- **Build a frontend** → Read [`FRONTEND_INTEGRATION.md`](FRONTEND_INTEGRATION.md)
- **Debug issues** → Read [`DEVELOPMENT.md`](DEVELOPMENT.md)
- **See project structure** → Read [`PROJECT_OVERVIEW.txt`](PROJECT_OVERVIEW.txt)

## ✅ What You Have

```
✅ Complete REST API with 15 endpoints
✅ User authentication with JWT
✅ Wedding invitation management
✅ Guest confirmation system
✅ Automatic QR code generation
✅ Supabase database schema
✅ Cloudflare Workers ready
✅ Full TypeScript codebase
✅ Comprehensive documentation
✅ Production-ready code
```

## 🎯 Next Steps (5 minutes)

### 1️⃣ Install Dependencies
```bash
npm install
```

### 2️⃣ Setup Environment
```bash
cp .env.example .dev.vars
# Edit .dev.vars with your Supabase credentials
```

Get credentials from supabase.com:
- `SUPABASE_URL`: Your project URL
- `SUPABASE_KEY`: Anon/public key
- `JWT_SECRET`: Generate with `openssl rand -base64 32`

### 3️⃣ Setup Database
1. Go to https://supabase.com and create a project
2. Copy entire `migrations/001_init.sql`
3. Paste into Supabase SQL Editor
4. Run the query

### 4️⃣ Start Development
```bash
npm run dev
```

Visit: http://localhost:8787/health

### 5️⃣ Test an Endpoint
```bash
curl -X POST http://localhost:8787/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!",
    "name": "Test User"
  }'
```

## 📂 Project Structure

```
api-wedding/
├── 📚 Documentation (start here!)
│   ├── START_HERE.md (this file) ← You are here
│   ├── QUICKSTART.md
│   ├── README.md
│   ├── API_DOCS.md
│   ├── DEPLOYMENT.md
│   ├── DEVELOPMENT.md
│   └── FRONTEND_INTEGRATION.md
│
├── 💻 Source Code
│   └── src/
│       ├── index.ts (main app)
│       ├── lib/ (utilities)
│       ├── routes/ (API endpoints)
│       └── types/ (TypeScript types)
│
├── ⚙️ Config Files
│   ├── package.json
│   ├── wrangler.toml
│   ├── tsconfig.json
│   ├── .eslintrc.json
│   ├── .env.example
│   └── .gitignore
│
└── 💾 Database
    └── migrations/
        └── 001_init.sql
```

## 🎮 API Endpoints Overview

### 🔐 Authentication (4 endpoints)
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/verify` - Verify token

### 💍 Invitations (5 endpoints)
- `POST /api/invitations` - Create invitation
- `GET /api/invitations` - List invitations
- `GET /api/invitations/:code` - Get by code (public)
- `PUT /api/invitations/:id` - Update
- `DELETE /api/invitations/:id` - Delete

### ✅ Confirmations (5 endpoints)
- `POST /api/confirmations/confirm` - Confirm attendance (public)
- `GET /api/confirmations/:code` - Get confirmation (public)
- `GET /api/confirmations/invitations/:id` - List confirmations
- `PUT /api/confirmations/:id` - Update
- `DELETE /api/confirmations/:id` - Delete

See [`API_DOCS.md`](API_DOCS.md) for complete details.

## 🔑 Invitation Code Format

Each invitation gets a unique code:

```
DI + DDMMYY + XXXX
Example: DI190223
├─ DI = Digital Invitation
├─ 19 = Day
├─ 02 = Month
├─ 23 = Year
└─ XXXX = Random 4-digit number
```

## 📊 Database Tables

### users
- id, email, password_hash, name, role, timestamps

### invitations
- id, user_id, invitation_code, groom_name, bride_name, ceremony_date, ceremony_time, location, description, max_guests, timestamps

### confirmations
- id, invitation_id, guest_name, guest_email, phone, plus_one, dietary_restrictions, confirmed, confirmation_code, qr_code_data, timestamps

## 🚀 Example Usage

### 1. Register a user
```bash
curl -X POST http://localhost:8787/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Pass123!","name":"John"}'
# Save the returned token
```

### 2. Create invitation
```bash
curl -X POST http://localhost:8787/api/invitations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "groom_name":"John",
    "bride_name":"Jane",
    "ceremony_date":"2024-12-25",
    "ceremony_time":"18:00",
    "location":"Grand Venue",
    "max_guests":150
  }'
# Get invitation_code from response (e.g., DI251224)
```

### 3. Guest confirms attendance
```bash
curl -X POST http://localhost:8787/api/confirmations/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "invitation_code":"DI251224",
    "guest_name":"Michael",
    "guest_email":"michael@example.com",
    "confirmed":true
  }'
# Get QR code in response
```

## 🛠 Technology Stack

| Component | Technology |
|-----------|-----------|
| **Runtime** | Cloudflare Workers |
| **Framework** | Hono v4+ |
| **Language** | TypeScript |
| **Database** | Supabase PostgreSQL |
| **Authentication** | JWT |
| **QR Codes** | qrcode library |
| **Build Tool** | Wrangler |

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| **START_HERE.md** | This file - quick overview |
| **QUICKSTART.md** | 5-minute setup and testing |
| **README.md** | Full project documentation |
| **API_DOCS.md** | Detailed API reference |
| **DEPLOYMENT.md** | Production deployment |
| **DEVELOPMENT.md** | Development workflow |
| **FRONTEND_INTEGRATION.md** | Code examples |
| **PROJECT_OVERVIEW.txt** | Visual project structure |

## ❓ Common Questions

**Q: How do I deploy to production?**
A: See [`DEPLOYMENT.md`](DEPLOYMENT.md) for Cloudflare deployment steps.

**Q: How do I build a frontend?**
A: See [`FRONTEND_INTEGRATION.md`](FRONTEND_INTEGRATION.md) for code examples.

**Q: How do I fix errors?**
A: See [`DEVELOPMENT.md`](DEVELOPMENT.md) for troubleshooting.

**Q: What are all the endpoints?**
A: See [`API_DOCS.md`](API_DOCS.md) for complete API reference.

**Q: How is the database set up?**
A: See `migrations/001_init.sql` for schema, or [`README.md`](README.md) for explanation.

## 🎓 Learning Resources

- **Hono** (Framework): https://hono.dev
- **Cloudflare Workers**: https://developers.cloudflare.com/workers/
- **Supabase** (Database): https://supabase.com/docs
- **TypeScript**: https://www.typescriptlang.org/

## ✨ Features

✅ **User Authentication**
- Registration and login
- JWT tokens (24-hour expiration)
- Secure password hashing

✅ **Invitation Management**
- Create unlimited invitations
- Unique codes (DI + date + random)
- Update and delete
- Public access by code

✅ **Guest Confirmations**
- Record attendance
- Auto-generate QR codes
- Track dietary restrictions
- Plus one companions
- View statistics

✅ **Production Ready**
- TypeScript
- CORS enabled
- Error handling
- Logging
- Deployment ready

## 🚀 Deployment Checklist

- [ ] Read QUICKSTART.md
- [ ] Install dependencies: `npm install`
- [ ] Create Supabase account
- [ ] Run database migration
- [ ] Configure .env.local
- [ ] Run locally: `npm run dev`
- [ ] Test endpoints
- [ ] Build for production: `npm run build`
- [ ] Deploy to Cloudflare: `npm run deploy`

## 📞 Need Help?

1. **Quick Setup** → [`QUICKSTART.md`](QUICKSTART.md)
2. **API Questions** → [`API_DOCS.md`](API_DOCS.md)
3. **Errors/Issues** → [`DEVELOPMENT.md`](DEVELOPMENT.md)
4. **Deployment** → [`DEPLOYMENT.md`](DEPLOYMENT.md)
5. **Frontend Code** → [`FRONTEND_INTEGRATION.md`](FRONTEND_INTEGRATION.md)

---

## 🎉 You're All Set!

Your wedding invitation API is ready to use. Start with:

```bash
npm install
npm run dev
```

Then visit: http://localhost:8787/health

**Next → Read [`QUICKSTART.md`](QUICKSTART.md)**
