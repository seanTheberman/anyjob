# Authentication System Documentation

## Overview

This application uses Supabase Authentication with custom user profiles for two types of users:
- **Buyers** (Customers/Clients)
- **Sellers** (Service Providers/Taskers)

## Database Schema

### Tables

1. **user_profiles** - Common profile data for all users
   - Links to `auth.users`
   - Stores role, full name, avatar, login tracking
   - RLS enabled

2. **buyers** - Buyer-specific data
   - Personal information
   - Address details
   - Preferences
   - RLS enabled

3. **sellers** - Seller-specific data
   - Personal and business information
   - Service details
   - Verification status
   - Documents
   - Rating and job history
   - RLS enabled

## API Endpoints

### 1. Register Buyer
**POST** `/api/auth/register-buyer`

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "phone": "0612345678",
  "address": "123 Main St",
  "city": "Paris",
  "postalCode": "75001",
  "newsletterSubscribed": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account created successfully! Please check your email to verify your account.",
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "role": "buyer"
  }
}
```

### 2. Register Seller
**POST** `/api/auth/register-seller`

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "password": "SecurePass123!",
  "phone": "0612345678",
  "address": "456 Service Ave",
  "city": "Lyon",
  "postalCode": "69001",
  "birthDate": "1990-01-01",
  "serviceCategory": "Plumbing",
  "experience": "5 years",
  "description": "Professional plumber",
  "siret": "12345678901234",
  "insurance": "Yes",
  "termsAccepted": true,
  "newsletterAccepted": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Seller registration submitted successfully! Your account is pending approval.",
  "user": {
    "id": "uuid",
    "email": "jane@example.com",
    "role": "seller",
    "status": "pending"
  }
}
```

### 3. Login
**POST** `/api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "buyer",
    "fullName": "John Doe",
    "avatarUrl": null,
    // ... additional user data based on role
  },
  "session": {
    // Supabase session data
  }
}
```

### 4. Logout
**POST** `/api/auth/logout`

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Using Auth Helpers

### Server-Side Usage

```typescript
import { 
  getCurrentUser, 
  requireAuth, 
  requireRole,
  getBuyerProfile,
  getSellerProfile 
} from '@/lib/auth/auth-helpers';

// Get current user (returns null if not authenticated)
const user = await getCurrentUser();

// Require authentication (throws error if not authenticated)
const user = await requireAuth();

// Require specific role (throws error if wrong role)
const seller = await requireRole('seller');

// Get buyer profile
const buyerProfile = await getBuyerProfile(userId);

// Get seller profile
const sellerProfile = await getSellerProfile(userId);
```

### Protected API Routes Example

```typescript
import { requireAuth, requireRole } from '@/lib/auth/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth();
    
    // Or require specific role
    const seller = await requireRole('seller');
    
    // Your protected logic here
    
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 401 }
    );
  }
}
```

## User Roles

- **buyer**: Regular customers who book services
- **seller**: Service providers who offer services
- **admin**: Platform administrators (future implementation)

## Seller Status

- **pending**: Awaiting approval
- **approved**: Can offer services
- **rejected**: Application denied
- **suspended**: Temporarily disabled

## Row Level Security (RLS)

All tables have RLS enabled with the following policies:

### Buyers
- Can view their own data
- Can update their own data

### Sellers
- Can view their own data
- Can update their own data
- Public can view approved sellers only

### User Profiles
- Users can view their own profile
- Users can update their own profile

## Email Verification

When users register, Supabase automatically sends a verification email. Users should verify their email before full access is granted.

## Password Requirements

- Minimum 8 characters
- Must contain uppercase and lowercase letters (recommended)
- Must contain numbers (recommended)
- Must contain special characters (recommended)

## Security Best Practices

1. Always use HTTPS in production
2. Store Supabase credentials in environment variables
3. Never expose service role key to client
4. Implement rate limiting on auth endpoints
5. Use strong password requirements
6. Enable email verification
7. Implement 2FA for sensitive operations (future)

## Testing

### Test Buyer Registration
```bash
curl -X POST http://localhost:3000/api/auth/register-buyer \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "Buyer",
    "email": "testbuyer@example.com",
    "password": "TestPass123!",
    "phone": "0612345678",
    "city": "Paris"
  }'
```

### Test Seller Registration
```bash
curl -X POST http://localhost:3000/api/auth/register-seller \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "Seller",
    "email": "testseller@example.com",
    "password": "TestPass123!",
    "phone": "0612345678",
    "address": "123 Test St",
    "city": "Lyon",
    "postalCode": "69001",
    "birthDate": "1990-01-01",
    "serviceCategory": "Cleaning",
    "termsAccepted": true
  }'
```

### Test Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testbuyer@example.com",
    "password": "TestPass123!"
  }'
```

## Troubleshooting

### "Email already exists"
- User with this email is already registered
- Try logging in instead or use password reset

### "Account is pending approval" (Sellers)
- Seller accounts require admin approval
- Check email for approval status updates

### "Invalid email or password"
- Check credentials are correct
- Ensure email is verified
- Check if account is active

### "Failed to create profile"
- Database connection issue
- Check Supabase configuration
- Verify RLS policies are correct

## Future Enhancements

- [ ] Password reset functionality
- [ ] Email change with verification
- [ ] Two-factor authentication (2FA)
- [ ] Social login (Google, Facebook)
- [ ] Admin dashboard for seller approval
- [ ] Seller document upload and verification
- [ ] Advanced profile management
- [ ] Session management and refresh tokens
