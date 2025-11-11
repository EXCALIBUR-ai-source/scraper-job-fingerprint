# Job Fingerprint

Job Fingerprint is a browser extension that helps you track and organize your job applications by allowing you to bookmark job posting pages and save them to Supabase. The extension provides an easy way to mark job postings you've applied to and quickly check if you've already bookmarked a particular job posting.

## Features

- 🔖 Quickly bookmark job posting pages with a keyboard shortcut (Alt+A)
- 🔍 Visual indicator showing whether you've already bookmarked a page
- 🔐 Secure authentication using email verification (OTP)
- 👤 User profile management in Supabase
- 📊 Dashboard to view all saved jobs
- 💫 Beautiful sign-in/sign-up UI (both popup and in-page panel)
- ☁️ Cloud storage using Supabase
- 🌐 Works across all websites

## Installation

1. Clone this repository or download the source code
2. Load the extension in your browser:
   - Open your browser's extension management page
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the folder containing the extension files

## Usage

### Authentication
1. Click on the Job Fingerprint extension icon in your browser
2. **Sign up** (first time users):
   - Enter your username and email address
   - Receive a 6-digit verification code via email
   - Enter the code to create your account
   - Your profile will be created in the Supabase User table
3. **Sign in** (returning users):
   - Enter your email address
   - Receive a 6-digit verification code via email
   - Enter the code to sign in
   - Your profile will be synced from the Supabase User table

### Saving Jobs
1. Navigate to any job posting page (LinkedIn, Indeed, company career pages, etc.)
2. Press `Alt+A` to bookmark the current job
3. If not signed in, a panel will appear allowing you to sign in/sign up
4. The extension will automatically:
   - Extract job title, company name, and URL
   - Save the job to your Supabase database
   - Associate it with your user profile

### Viewing Saved Jobs
1. Click the extension icon to open the dashboard
2. View statistics: total saved jobs, jobs saved this week
3. Browse your recent job applications
4. Click any job URL to open it in a new tab

### Panel Features
A floating panel appears on job pages showing:
- Whether you've already bookmarked this job (YES/NO)
- Sign in/Sign up forms if not authenticated
- Quick access to bookmark the current page

## Technical Details

The extension is built using:
- **Manifest V3** for modern browser extension support
- **Supabase** for authentication and data storage
  - `auth.users` table for authentication
  - `User` table for user profiles (id, email, username, created_at)
  - `positionApplied` table for saved job applications
- **Content scripts** for page interaction and floating panel UI
- **Background service worker** for handling keyboard shortcuts
- **Email OTP** authentication (passwordless login)

### Database Schema

#### User Table
```sql
CREATE TABLE "User" (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  username TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### PositionApplied Table
```sql
CREATE TABLE "positionApplied" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES "User"(id) ON DELETE CASCADE,
  company TEXT,
  job_title TEXT,
  position_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Files Structure

### Core Files
- `manifest.json` - Extension configuration and permissions
- `config.js` - Supabase configuration and API functions
- `background.js` - Service worker for background tasks and keyboard shortcuts

### Popup & Dashboard
- `popup.html` - Router page (redirects based on auth state)
- `popup.js` - Auth state checker and router logic
- `signin.html` / `signin.js` - Sign in page with OTP verification
- `signup.html` / `signup.js` - Sign up page with username + email
- `dashboard.html` / `dashboard.js` - User dashboard showing saved jobs

### Content Scripts
- `content.js` - Floating panel with sign-in/sign-up forms and job status
- `supabase.js` - Supabase client initialization
- `supabase-js.umd.js` - Supabase JavaScript library

### Documentation
- `README.md` - This file
- `USER_PROFILE_GUIDE.md` - Detailed guide on user profile system

## Permissions

The extension requires the following permissions:
- `storage` - For storing user preferences
- `activeTab` - For accessing the current tab's information
- `scripting` - For injecting content scripts
- `tabs` - For tab management
- `commands` - For keyboard shortcut support

## Development

### Setup
1. Clone the repository
2. Set up your Supabase project:
   - Create a new Supabase project
   - Create the `User` and `positionApplied` tables (see schema above)
   - Enable Row Level Security (RLS) policies
   - Get your project URL and anon key
3. Update `supabase.js` with your Supabase credentials:
   ```javascript
   const SUPABASE_URL = "your-project-url";
   const SUPABASE_ANON_KEY = "your-anon-key";
   ```

### Making Changes
1. Make your changes to the source files
2. If you modify the manifest or add new features, reload the extension
3. Test the changes by loading the unpacked extension in your browser
4. Check the browser console for any errors

### Key Functions (config.js)

- `sendEmailOtp(email)` - Send OTP code to user's email
- `verifyEmailOtp(email, token)` - Verify OTP code and authenticate
- `upsertUser({ id, email, username })` - Insert/update user profile in User table
- `getUserProfile(userId)` - Fetch user profile from User table
- `savePositionApplied({ company, job_title, position_url, user_id })` - Save a job application
- `findPositionByUuid({ uuid, user_id })` - Check if job is already saved

### Testing

See `USER_PROFILE_GUIDE.md` for detailed testing instructions and authentication flow diagrams.

## Contributing

Feel free to open issues or submit pull requests if you have suggestions for improvements or bug fixes.

## License

This project is open source and available under the MIT License.