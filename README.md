# Wedding Invitation API

A fully-featured digital wedding invitation API built with **Hono**, **Cloudflare Workers**, and **Supabase**. This API provides authentication, invitation management, guest confirmations, and QR code generation.

## Features

✅ **Authentication**

- User registration and login with JWT tokens
- Secure password hashing
- Token verification and expiration

✅ **Invitation Management**

- Create digital wedding invitations
- Unique invitation codes (e.g., `DI190223`)
- Manage invitation details (groom/bride names, ceremony details, location)
- Public access to view invitations by code

✅ **Guest Confirmations**

- Guest attendance confirmation
- Automatic QR code generation for confirmations
- Track dietary restrictions and plus ones
- Confirmation statistics and analytics

✅ **Database**

- Supabase PostgreSQL with Row Level Security (RLS)
- Optimized indexes for fast queries
- Relational structure for invitations, guests, and confirmations

✅ **Deployment**

- Cloudflare Workers runtime
- Serverless and scalable
- Global edge network

## Tech Stack

- **Runtime**: Cloudflare Workers
- **Framework**: Hono (lightweight web framework)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT (jose library)
- **QR Codes**: qrcode library
- **Language**: TypeScript

## Project Structure

```
api-wedding/
├── src/
│   ├── index.ts                 # Main app entry point
│   ├── lib/
│   │   ├── supabase.ts          # Supabase client initialization
│   │   ├── jwt.ts               # JWT token generation and verification
│   │   ├── utils.ts             # Helper utilities (codes, hashing)
│   │   └── qr.ts                # QR code generation
│   └── routes/
│       ├── auth.ts              # Authentication endpoints
│       ├── invitations.ts       # Invitation management
│       └── confirmations.ts     # Confirmation and QR endpoints
├── migrations/
│   └── 001_init.sql             # Database schema
├── package.json
├── wrangler.toml                # Cloudflare Workers config
├── tsconfig.json
└── README.md
```

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account (https://supabase.com)
- Cloudflare account (https://cloudflare.com)

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Supabase

1. Create a new project in [Supabase](https://supabase.com)
2. Go to **SQL Editor** and run the migration script from `migrations/001_init.sql`
3. Get your **Project URL** and **Anon Public Key** from project settings

### 4. Configure Environment Variables

Create a `.dev.vars` file for local development:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-public-key
JWT_SECRET=your-super-secret-key-here
API_DOMAIN=http://localhost:8787
```

For production, add these to your Cloudflare Worker secrets.

### 5. Run Locally

```bash
npm run dev
```

The API will be available at `http://localhost:8787`

### 6. Deploy to Cloudflare

```bash
npm run deploy
```

## API Endpoints

### Authentication

#### Register User

```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure-password",
  "name": "John Doe"
}
```

Response:

```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "token": "jwt-token"
}
```

#### Login

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure-password"
}
```

#### Verify Token

```bash
POST /api/auth/verify
Authorization: Bearer {token}
```

#### Get Current User

```bash
GET /api/auth/me
Authorization: Bearer {token}
```

### Invitations

#### Create Invitation (Protected)

```bash
POST /api/invitations
Authorization: Bearer {token}
Content-Type: application/json

{
  "groom_name": "John Smith",
  "bride_name": "Jane Doe",
  "ceremony_date": "2024-06-15",
  "ceremony_time": "18:00",
  "location": "Grand Ballroom, Downtown",
  "description": "Join us for our wedding celebration!",
  "max_guests": 150
}
```

Response:

```json
{
  "message": "Invitation created successfully",
  "invitation": {
    "id": "uuid",
    "invitation_code": "DI150624",
    "groom_name": "John Smith",
    "bride_name": "Jane Doe",
    "ceremony_date": "2024-06-15",
    "ceremony_time": "18:00",
    "location": "Grand Ballroom, Downtown",
    "created_at": "2024-06-01T10:00:00Z"
  }
}
```

#### Get Invitation by Code (Public)

```bash
GET /api/invitations/DI150624
```

#### List All Invitations (Protected)

```bash
GET /api/invitations
Authorization: Bearer {token}
```

#### Update Invitation (Protected)

```bash
PUT /api/invitations/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "groom_name": "Updated Name",
  "ceremony_date": "2024-06-16"
}
```

#### Delete Invitation (Protected)

```bash
DELETE /api/invitations/{id}
Authorization: Bearer {token}
```

### Confirmations

#### Confirm Attendance (Public)

```bash
POST /api/confirmations/confirm
Content-Type: application/json

{
  "invitation_code": "DI150624",
  "guest_name": "Michael Johnson",
  "guest_email": "michael@example.com",
  "phone": "+1234567890",
  "plus_one": true,
  "dietary_restrictions": "Vegetarian",
  "confirmed": true
}
```

Response:

```json
{
  "message": "Attendance confirmed successfully",
  "confirmation": {
    "id": "uuid",
    "confirmation_code": "CONF12345678",
    "guest_name": "Michael Johnson",
    "guest_email": "michael@example.com",
    "confirmed": true,
    "qr_code": "data:image/png;base64,..."
  }
}
```

#### Get Confirmation by Code (Public)

```bash
GET /api/confirmations/CONF12345678
```

#### Get All Confirmations for Invitation (Protected)

```bash
GET /api/confirmations/invitations/{invitation_id}
Authorization: Bearer {token}
```

Response includes confirmation statistics:

```json
{
  "confirmations": [...],
  "stats": {
    "total": 45,
    "confirmed": 32,
    "pending": 13,
    "with_plus_one": 8
  }
}
```

#### Update Confirmation (Protected)

```bash
PUT /api/confirmations/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "confirmed": true,
  "dietary_restrictions": "Vegan"
}
```

#### Delete Confirmation (Protected)

```bash
DELETE /api/confirmations/{id}
Authorization: Bearer {token}
```

## Invitation Code Format

The invitation code follows this format:

```
DI + DDMMYY + XXXX

DI       = Fixed prefix for "Digital Invitation"
DDMMYY   = Creation date (day, month, year)
XXXX     = Random 4-digit number for uniqueness

Example: DI190223 = Created on 19th Feb 2023, with random suffix
```

## QR Code Generation

When a guest confirms their attendance, a QR code is automatically generated containing:

- Invitation code
- Confirmation code
- Guest email
- Timestamp

This QR code can be:

- Stored in the database
- Sent via email to the guest
- Scanned at the venue for check-in

## Database Schema

### users

- `id`: UUID primary key
- `email`: Unique email address
- `password_hash`: Hashed password
- `name`: User's full name
- `role`: User role (default: 'user')
- `created_at`, `updated_at`: Timestamps

### invitations

- `id`: UUID primary key
- `user_id`: Reference to user (foreign key)
- `invitation_code`: Unique code (e.g., DI190223)
- `groom_name`, `bride_name`: Names
- `ceremony_date`, `ceremony_time`: Event details
- `location`: Venue address
- `description`: Optional description
- `max_guests`: Maximum guest count

### confirmations

- `id`: UUID primary key
- `invitation_id`: Reference to invitation (foreign key)
- `guest_name`, `guest_email`: Guest details
- `phone`: Optional phone number
- `plus_one`: Boolean flag
- `dietary_restrictions`: Optional dietary info
- `confirmed`: Boolean confirmation status
- `confirmation_code`: Unique confirmation code
- `qr_code_data`: QR code image data

## Security Considerations

1. **JWT Tokens**: Set a strong JWT_SECRET (min 32 characters)
2. **Row Level Security**: Database policies enforce user isolation
3. **Password Hashing**: SHA-256 hashing (consider bcrypt for production)
4. **CORS**: Configured to handle cross-origin requests
5. **Token Expiration**: 24-hour default expiration

## Troubleshooting

### "Cannot find module" errors

```bash
npm install
npm run type-check
```

### Supabase connection issues

- Verify SUPABASE_URL and SUPABASE_KEY
- Check firewall/network permissions
- Test connection with `curl https://your-project.supabase.co`

### QR Code generation failing

- Check qrcode library is installed
- Verify data size is reasonable
- Try with simpler data format

## Development

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

### Build

```bash
npm run build
```

## Production Deployment

1. Set up Cloudflare Workers secrets:

```bash
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_KEY
wrangler secret put JWT_SECRET
```

2. Update `wrangler.toml` with your domain

3. Deploy:

```bash
npm run deploy
```

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
