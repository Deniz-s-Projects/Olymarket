# Admin User Credentials

A hardcoded admin user has been added to the Olymarket system for administrative purposes.

## Credentials

- **Email:** `admin@olymarket.com`
- **Password:** `Admin@2024`
- **Role:** `admin`

## Usage

Use these credentials to log in to the system with administrator privileges. The admin user has access to:

- All user management features
- Listing moderation
- Administrative dashboard
- All standard user features

## Security Note

⚠️ **Important:** These are development/demo credentials. In a production environment:
1. Change the admin password immediately after first deployment
2. Use environment variables to manage admin credentials
3. Implement proper secret management
4. Enable two-factor authentication for admin accounts

## How it was created

The admin user was created via database migration `1730335200000-AddSavedListingsAndAdminUser.ts` which:
- Creates the user with a hashed password
- Sets the role to 'admin'
- Uses `ON CONFLICT DO NOTHING` to prevent duplicate creation
