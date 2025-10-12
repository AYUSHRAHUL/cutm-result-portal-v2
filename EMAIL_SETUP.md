# Email Configuration Guide

## Required Environment Variables

Add these to your `.env.local` file:

```env
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password-here
```

## Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this 16-character password in `EMAIL_PASS`

## Other Email Services

### Outlook/Hotmail
```env
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

### Yahoo
```env
EMAIL_USER=your-email@yahoo.com
EMAIL_PASS=your-app-password
```

## Testing Email Configuration

The system will automatically test the email connection when sending OTPs. Check the console logs for any connection errors.

## Email Templates

The system sends professional HTML emails with:
- CUTM Portal branding
- OTP in large, clear format
- Security warnings
- 10-minute expiration notice
- Professional styling

## Troubleshooting

- **Authentication failed**: Check your email and app password
- **Connection timeout**: Check your internet connection
- **Invalid credentials**: Verify your email and password are correct
- **Gmail blocking**: Make sure 2FA is enabled and you're using an app password
