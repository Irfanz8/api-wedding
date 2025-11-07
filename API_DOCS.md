# API Documentation - Wedding Invitation System

## Overview

Complete REST API for managing digital wedding invitations with guest confirmations and QR code generation.

**Base URL**: `https://api-wedding.com` (or `http://localhost:8787` for development)

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer {token}
```

## Response Format

All responses are in JSON format with the following structure:

**Success**:

```json
{
  "message": "Success message",
  "data": { ... }
}
```

**Error**:

```json
{
  "error": "Error message",
  "status": 400
}
```

## Authentication Endpoints

### 1. Register User

Creates a new user account.

**Request**:

```
POST /api/auth/register
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!",
  "name": "John Smith"
}
```

**Parameters**:

- `email` (string, required): User's email address
- `password` (string, required): User's password (min 8 characters recommended)
- `name` (string, required): User's full name

**Success Response (201)**:

```json
{
  "message": "User registered successfully",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com",
    "name": "John Smith"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response (400)**:

```json
{
  "error": "Email already registered",
  "status": 400
}
```

---

### 2. Login

Authenticates a user and returns a JWT token.

**Request**:

```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Parameters**:

- `email` (string, required): User's email address
- `password` (string, required): User's password

**Success Response (200)**:

```json
{
  "message": "Login successful",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com",
    "name": "John Smith"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response (401)**:

```json
{
  "error": "Invalid email or password",
  "status": 401
}
```

---

### 3. Verify Token

Verifies if a JWT token is valid.

**Request**:

```
POST /api/auth/verify
Authorization: Bearer {token}
```

**Success Response (200)**:

```json
{
  "valid": true,
  "payload": {
    "sub": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com",
    "role": "user",
    "iat": 1700000000,
    "exp": 1700086400
  }
}
```

**Error Response (401)**:

```json
{
  "error": "Invalid or expired token",
  "status": 401
}
```

---

### 4. Get Current User

Retrieves the authenticated user's profile.

**Request**:

```
GET /api/auth/me
Authorization: Bearer {token}
```

**Success Response (200)**:

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com",
    "name": "John Smith",
    "role": "user",
    "created_at": "2024-06-01T10:00:00Z"
  }
}
```

---

## Invitation Endpoints

### 1. Create Invitation

Creates a new wedding invitation (requires authentication).

**Request**:

```
POST /api/invitations
Authorization: Bearer {token}
Content-Type: application/json

{
  "groom_name": "John Smith",
  "bride_name": "Jane Doe",
  "ceremony_date": "2024-06-15",
  "ceremony_time": "18:00",
  "location": "Grand Ballroom, 123 Main St, Downtown",
  "description": "Join us for our wedding celebration",
  "max_guests": 150
}
```

**Parameters**:

- `groom_name` (string, required): Groom's full name
- `bride_name` (string, required): Bride's full name
- `ceremony_date` (string, required): Date in YYYY-MM-DD format
- `ceremony_time` (string, required): Time in HH:MM format (24-hour)
- `location` (string, required): Venue address
- `description` (string, optional): Event description
- `max_guests` (integer, optional): Maximum guest count (default: 100)

**Success Response (201)**:

```json
{
  "message": "Invitation created successfully",
  "invitation": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "invitation_code": "DI150624",
    "groom_name": "John Smith",
    "bride_name": "Jane Doe",
    "ceremony_date": "2024-06-15",
    "ceremony_time": "18:00",
    "location": "Grand Ballroom, 123 Main St, Downtown",
    "description": "Join us for our wedding celebration",
    "max_guests": 150,
    "created_at": "2024-06-01T10:00:00Z",
    "updated_at": "2024-06-01T10:00:00Z"
  }
}
```

---

### 2. Get Invitation by Code

Retrieves a specific invitation using its code (public endpoint).

**Request**:

```
GET /api/invitations/DI150624
```

**Parameters**:

- `code` (string, required): Invitation code (path parameter)

**Success Response (200)**:

```json
{
  "invitation": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "invitation_code": "DI150624",
    "groom_name": "John Smith",
    "bride_name": "Jane Doe",
    "ceremony_date": "2024-06-15",
    "ceremony_time": "18:00",
    "location": "Grand Ballroom, 123 Main St, Downtown",
    "description": "Join us for our wedding celebration",
    "max_guests": 150,
    "created_at": "2024-06-01T10:00:00Z"
  }
}
```

**Error Response (404)**:

```json
{
  "error": "Invitation not found",
  "status": 404
}
```

---

### 3. List All Invitations

Lists all invitations created by the authenticated user.

**Request**:

```
GET /api/invitations
Authorization: Bearer {token}
```

**Query Parameters** (optional):

- `page` (integer): Page number for pagination (default: 1)
- `limit` (integer): Items per page (default: 10)

**Success Response (200)**:

```json
{
  "invitations": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "invitation_code": "DI150624",
      "groom_name": "John Smith",
      "bride_name": "Jane Doe",
      "ceremony_date": "2024-06-15",
      "ceremony_time": "18:00",
      "location": "Grand Ballroom, 123 Main St, Downtown",
      "created_at": "2024-06-01T10:00:00Z"
    }
  ]
}
```

---

### 4. Update Invitation

Updates an existing invitation (requires authentication).

**Request**:

```
PUT /api/invitations/660e8400-e29b-41d4-a716-446655440001
Authorization: Bearer {token}
Content-Type: application/json

{
  "location": "Updated Venue Address",
  "max_guests": 200
}
```

**Parameters** (all optional):

- `groom_name`, `bride_name`, `ceremony_date`, `ceremony_time`, `location`, `description`, `max_guests`

**Success Response (200)**:

```json
{
  "message": "Invitation updated successfully",
  "invitation": { ... }
}
```

---

### 5. Delete Invitation

Deletes an invitation and all associated confirmations.

**Request**:

```
DELETE /api/invitations/660e8400-e29b-41d4-a716-446655440001
Authorization: Bearer {token}
```

**Success Response (200)**:

```json
{
  "message": "Invitation deleted successfully"
}
```

---

## Confirmation Endpoints

### 1. Confirm Attendance

Records guest attendance confirmation (public endpoint, generates QR code).

**Request**:

```
POST /api/confirmations/confirm
Content-Type: application/json

{
  "invitation_code": "DI150624",
  "guest_name": "Michael Johnson",
  "guest_email": "michael@example.com",
  "phone": "+1-555-123-4567",
  "plus_one": false,
  "dietary_restrictions": "Vegetarian",
  "confirmed": true
}
```

**Parameters**:

- `invitation_code` (string, required): The invitation code
- `guest_name` (string, required): Guest's full name
- `guest_email` (string, required): Guest's email address
- `phone` (string, optional): Guest's phone number
- `plus_one` (boolean, optional): Whether guest has a plus one (default: false)
- `dietary_restrictions` (string, optional): Dietary preferences/restrictions
- `confirmed` (boolean, required): Attendance confirmation status

**Success Response (201)**:

```json
{
  "message": "Attendance confirmed successfully",
  "confirmation": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "confirmation_code": "CONF12345678",
    "guest_name": "Michael Johnson",
    "guest_email": "michael@example.com",
    "confirmed": true,
    "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA..."
  }
}
```

**Notes**:

- If the guest's email already has a confirmation for this invitation, it will update the existing record
- QR code contains: invitation code, confirmation code, guest email, and timestamp
- QR code can be saved and sent to guest via email

---

### 2. Get Confirmation by Code

Retrieves a confirmation record by its code (public endpoint).

**Request**:

```
GET /api/confirmations/CONF12345678
```

**Success Response (200)**:

```json
{
  "confirmation": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "invitation_id": "660e8400-e29b-41d4-a716-446655440001",
    "guest_name": "Michael Johnson",
    "guest_email": "michael@example.com",
    "phone": "+1-555-123-4567",
    "plus_one": false,
    "dietary_restrictions": "Vegetarian",
    "confirmed": true,
    "confirmation_code": "CONF12345678",
    "created_at": "2024-06-02T14:30:00Z",
    "invitations": {
      "invitation_code": "DI150624",
      "groom_name": "John Smith",
      "bride_name": "Jane Doe",
      "ceremony_date": "2024-06-15",
      "location": "Grand Ballroom, 123 Main St, Downtown"
    }
  }
}
```

---

### 3. Get All Confirmations for Invitation

Retrieves all confirmations for a specific invitation with statistics.

**Request**:

```
GET /api/confirmations/invitations/660e8400-e29b-41d4-a716-446655440001
Authorization: Bearer {token}
```

**Success Response (200)**:

```json
{
  "confirmations": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "guest_name": "Michael Johnson",
      "guest_email": "michael@example.com",
      "confirmed": true,
      "plus_one": false,
      "created_at": "2024-06-02T14:30:00Z"
    }
  ],
  "stats": {
    "total": 45,
    "confirmed": 32,
    "pending": 13,
    "with_plus_one": 8
  }
}
```

**Statistics Breakdown**:

- `total`: Total number of confirmations
- `confirmed`: Number of confirmed guests
- `pending`: Number of pending confirmations
- `with_plus_one`: Number of guests bringing a plus one

---

### 4. Update Confirmation

Updates an existing confirmation record.

**Request**:

```
PUT /api/confirmations/770e8400-e29b-41d4-a716-446655440002
Authorization: Bearer {token}
Content-Type: application/json

{
  "confirmed": true,
  "dietary_restrictions": "Vegan",
  "plus_one": true
}
```

**Parameters** (all optional):

- `confirmed` (boolean): Attendance confirmation status
- `guest_name` (string): Guest's name
- `guest_email` (string): Guest's email
- `phone` (string): Guest's phone number
- `dietary_restrictions` (string): Dietary preferences

**Success Response (200)**:

```json
{
  "message": "Confirmation updated successfully",
  "confirmation": { ... }
}
```

---

### 5. Delete Confirmation

Removes a guest confirmation record.

**Request**:

```
DELETE /api/confirmations/770e8400-e29b-41d4-a716-446655440002
Authorization: Bearer {token}
```

**Success Response (200)**:

```json
{
  "message": "Confirmation deleted successfully"
}
```

---

## Error Responses

### Common Error Codes

| Code | Error                 | Description                             |
| ---- | --------------------- | --------------------------------------- |
| 400  | Bad Request           | Invalid request parameters              |
| 401  | Unauthorized          | Missing or invalid authentication token |
| 404  | Not Found             | Resource not found                      |
| 500  | Internal Server Error | Server-side error                       |

### Example Error Response:

```json
{
  "error": "Invalid or expired token",
  "status": 401
}
```

---

## Usage Examples

### Example 1: Complete Flow - Create Invitation and Get Confirmations

**Step 1: Register User**

```bash
curl -X POST http://localhost:8787/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!",
    "name": "John Smith"
  }'
```

**Step 2: Create Invitation**

```bash
curl -X POST http://localhost:8787/api/invitations \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "groom_name": "John Smith",
    "bride_name": "Jane Doe",
    "ceremony_date": "2024-06-15",
    "ceremony_time": "18:00",
    "location": "Grand Ballroom",
    "max_guests": 150
  }'
```

Response will include `invitation_code`, e.g., `DI150624`

**Step 3: Guest Confirms Attendance**

```bash
curl -X POST http://localhost:8787/api/confirmations/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "invitation_code": "DI150624",
    "guest_name": "Michael Johnson",
    "guest_email": "michael@example.com",
    "confirmed": true,
    "dietary_restrictions": "Vegetarian"
  }'
```

Response includes `qr_code` (base64 PNG image)

**Step 4: View Confirmations**

```bash
curl -X GET http://localhost:8787/api/confirmations/invitations/{invitation_id} \
  -H "Authorization: Bearer {token}"
```

---

## Rate Limiting

Currently no rate limiting is implemented. Consider adding rate limiting in production.

## Pagination

For list endpoints, pagination can be added with `limit` and `offset` query parameters.

## Caching

QR codes are generated on-demand. Consider caching them in Cloudflare KV for performance.

---

## Support

For more information, see the main [README.md](README.md).
