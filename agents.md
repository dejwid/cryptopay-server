# CryptoPay Server - Project Documentation

## Project Overview

CryptoPay Server is a Next.js-based cryptocurrency payment processing platform that enables merchants to accept cryptocurrency payments for digital products and invoices. The application supports Bitcoin (BTC), Bitcoin Cash (BCH), Litecoin (LTC), and Ethereum (ETH).

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: MongoDB with Prisma ORM
- **Caching**: Upstash Redis
- **Authentication**: NextAuth.js v5 (Google OAuth)
- **UI**: Radix UI Themes, Tailwind CSS
- **File Storage**: AWS S3
- **Email**: Mailgun
- **Blockchain APIs**: CoinMarketCap, CryptoAPIs, Blockchain.info

## Project Structure

```
src/
├── app/
│   ├── (routes)/
│   │   ├── (dashboard)/          # Admin dashboard (requires auth)
│   │   │   ├── page.tsx          # Home with wallet stats
│   │   │   ├── addresses/        # Wallet address management
│   │   │   ├── automations/      # Automations (coming soon)
│   │   │   ├── invoices/         # Invoice CRUD
│   │   │   └── products/         # Product CRUD
│   │   ├── (front)/              # Public-facing pages
│   │   │   ├── (payment)/
│   │   │   │   ├── buy/          # Product purchase flow
│   │   │   │   └── invoice/      # Invoice payment flow
│   │   │   └── product/          # Product access/delivery
│   │   └── api/                  # API endpoints
│   ├── actions/                  # Server actions
│   ├── components/               # React components
│   └── libs/                     # Utility libraries
├── auth.ts                       # NextAuth configuration
├── middleware.ts                 # Auth middleware
└── prisma/
    └── schema.prisma             # Database schema
```

## Core Features

### 1. Product Management
- Create, edit, and archive digital products
- Set USD prices for products
- Upload files to S3 (images, videos, zip files)
- Preview products before publishing
- Generate public buy links

### 2. Invoice System
- Create invoices with USD amounts
- Allow payers to choose cryptocurrency (optional)
- Specify allowed coins for payment
- Track payment status (pending/paid)
- Edit unpaid invoices

### 3. Wallet Management
- Add wallet addresses for BTC, BCH, LTC, ETH
- Track balances with USD conversion
- Mark addresses as "busy" during payment windows
- Manual balance refresh

### 4. Payment Processing
- Automatic address assignment for invoices
- QR code generation for crypto payments
- Real-time payment detection via blockchain polling
- Balance change tracking
- 10% payment shortfall tolerance
- 1-hour payment window

### 5. Product Delivery
- Generate unique access codes
- Email delivery upon payment confirmation
- Access code validation
- Session-based product access

## Database Models

### User & Auth
- `User` - User accounts
- `Account` - OAuth accounts
- `Session` - User sessions
- `Authenticator` - WebAuthn credentials
- `VerificationToken` - Email verification

### Business Logic
- `Product` - Digital products with uploads and pricing
- `Invoice` - Payment requests with crypto amounts
- `Address` - Wallet addresses with balance tracking
- `BalanceChange` - Records of balance updates
- `ProductAccessCode` - Product delivery codes
- `Upload` - S3 file references
- `Settings` - User-specific settings

## API Endpoints

### Authentication
- `GET/POST /api/auth/[...nextauth]` - NextAuth handlers

### Payment Flow
- `GET /api/prices` - Get current crypto prices (cached 1 hour)
- `GET /api/invoice/[invoiceId]/paid` - Check if invoice is paid
- `GET /api/validate/invoices` - Validate all unpaid invoices

### Wallet Operations
- `GET /api/balance/[code]/[address]` - Get wallet balance
- `GET /api/create-wallets` - Generate new wallets (testing)

### Product Access
- `GET /api/access` - Validate product access codes

### File Upload
- `POST /api/upload/init` - Initialize S3 multipart upload
- `POST /api/upload/complete` - Complete S3 upload

### Testing
- `GET /api/test/balance` - Test balance APIs
- `GET /api/test/email` - Test email sending

## Server Actions

### Core Actions (`actions.ts`)
- `getUser()` / `getUserEmail()` - Get current user
- `addWalletAddressesAction()` - Add wallet addresses
- `saveProductAction()` - Create/update products
- `createProductInvoice()` - Create invoice from product
- `getAddressForInvoice()` - Assign address to invoice
- `validateInvoicePayment()` - Check for payment
- `archiveProductAction()` - Archive a product
- `createAndSendProductLink()` - Generate and send access code
- `isFirstTimeProductCodeUse()` - Validate access code

### Invoice Actions (`invoiceActions.ts`)
- `saveInvoice()` - Create/update invoices
- `selectInvoiceCoin()` - Select cryptocurrency for payment

### Session Actions (`sessionActions.ts`)
- `getSession()` - Get iron-session for product access

## Key Libraries

### Crypto Operations (`libs/`)
- `crypto-client.ts` - USD ↔ crypto conversion, payment URIs
- `cryptoPrices.ts` - CoinMarketCap price fetching with Redis caching
- `cryptoBalances.ts` - Blockchain balance checking (multiple sources)
- `cryptoWalletGenerators.ts` - Wallet creation for all supported coins

### Utilities
- `db.ts` - Prisma client
- `redis.ts` - Upstash Redis client
- `s3.ts` - AWS S3 client
- `mail.ts` - Mailgun email sending
- `session.ts` - Iron session configuration
- `config.ts` - App configuration constants

## Configuration

### Environment Variables Required
```env
# Database
DATABASE_URL=           # MongoDB connection string
REDIS_URL=              # Upstash Redis URL
REDIS_TOKEN=            # Upstash Redis token

# File Storage
S3_REGION=              # AWS S3 region
S3_BUCKET=              # S3 bucket name
S3_ACCESS_KEY_ID=       # AWS access key
S3_SECRET_ACCESS_KEY=   # AWS secret key

# Authentication
AUTH_SECRET=            # NextAuth secret
NEXTAUTH_SECRET=        # NextAuth secret
NEXTAUTH_URL=           # App URL
AUTH_GOOGLE_ID=         # Google OAuth client ID
AUTH_GOOGLE_SECRET=     # Google OAuth client secret

# Crypto APIs
COINMARKETCAP_API_KEY=  # For price data
BLOCKSDK_API_KEY=       # For blockchain data
CRYPTOAPIS_APIE_KEY=    # For blockchain data

# Email
MAILGUN_API_KEY=        # For sending emails
```

### App Configuration (`libs/config.ts`)
- `transactionAwaitSeconds`: 3600 (1 hour)
- `maxPaymentShortfall`: 0.1 (10% tolerance)
- `supportedCoins`: ['btc', 'bch', 'ltc', 'eth']

## Payment Flow

### Product Purchase Flow
1. Customer visits `/buy/[productId]`
2. Selects cryptocurrency and enters email
3. Invoice created with crypto amount
4. Customer redirected to `/invoice/[invoiceId]`
5. System assigns available wallet address
6. QR code displayed with payment URI
7. System polls for balance changes
8. On payment detection:
   - Invoice marked as paid
   - Access code generated
   - Email sent to customer
   - Merchant notified

### Direct Invoice Flow
1. Merchant creates invoice with USD amount
2. Can allow payer to choose coin or pre-select
3. Payer visits `/invoice/[invoiceId]`
4. If editable, payer selects cryptocurrency
5. Payment flow continues as above

## Address Management Logic

Addresses can be in these states:
- **Idle**: Not assigned to any invoice
- **Busy**: Assigned to active invoice (has `busyFrom` and `busyTo`)

When invoice needs address:
1. Check for existing address assigned to this invoice
2. If found and expired, extend busy period
3. Otherwise, find first idle address
4. Update balance and mark as busy
5. If no idle addresses, return error

## Payment Validation Logic

For each unpaid invoice:
1. Find address assigned to invoice
2. Check for balance changes during busy period
3. Look for change matching invoice amount (±10%)
4. If found:
   - Mark invoice as paid
   - Release address
   - Send product access email (if applicable)
   - Notify merchant

## Security Considerations

- Dashboard access restricted to specific email (hardcoded)
- Google OAuth required for admin access
- Product access requires valid code + session
- Private keys stored in database (consider HSM for production)

## Development Commands

```bash
bun dev          # Start development server
bun build        # Build for production
bun start        # Start production server
bun lint         # Run ESLint
bun postinstall  # Generate Prisma client
```

## Key Components

### Dashboard Components
- `DashboardNav` - Sidebar navigation
- `HomeStats` - Wallet balance overview
- `ProductsTable` - Product listing with actions
- `InvoicesTable` - Invoice listing with status
- `AddressesTable` - Wallet address management
- `ProductForm` / `InvoiceForm` - CRUD forms

### Payment Components
- `BuyForm` - Product purchase form with coin selection
- `PayInvoice` - Payment page with QR code
- `AwaitingPayment` - Payment polling indicator
- `CryptoCards` - Cryptocurrency selection UI
- `AccessGetter` - Product access validation

### Shared Components
- `Uploader` - S3 multipart file uploader
- `CopyButton` - Clipboard copy functionality
- `Login` - Authentication buttons
- `SubmitButton` - Form submit with loading state

## Notes for Development

1. **Balance Checking**: Multiple sources are tried in order; first success wins
2. **Price Caching**: Prices cached in Redis for 1 hour
3. **File Uploads**: Uses S3 multipart upload for large files (5MB chunks)
4. **Payment Detection**: Polls every 30 seconds while payment page is open
5. **Access Codes**: 4-digit numeric codes for product access
6. **Email Templates**: Plain text emails via Mailgun
