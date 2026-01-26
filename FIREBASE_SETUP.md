# Firebase Authentication Setup Guide

## 🔐 Setting Up Firebase for Node State Pulse

Follow these steps to configure Firebase Authentication with Google OAuth for your application.

---

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Add project"** or select an existing one
3. Enter project name: `node-state-pulse` (or your preferred name)
4. Disable Google Analytics (optional for this project)
5. Click **"Create Project"**

---

## Step 2: Enable Google Authentication

1. In the Firebase Console, go to **Authentication** from the left sidebar
2. Click **"Get Started"** if it's your first time
3. Go to the **"Sign-in method"** tab
4. Find **Google** in the list of providers
5. Click on it and toggle **"Enable"**
6. Set a **Project support email** (your email)
7. Click **"Save"**

---

## Step 3: Register Your Web App

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to **"Your apps"** section
3. Click the **Web icon** (`</>`) to add a web app
4. Enter app nickname: `Node State Pulse Web`
5. Check **"Also set up Firebase Hosting"** (optional)
6. Click **"Register app"**
7. **Copy the configuration object** that appears

---

## Step 4: Configure Environment Variables

1. Open `.env.local` in your project root
2. Replace the placeholder values with your Firebase credentials:

```env
VITE_FIREBASE_API_KEY=your-actual-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

3. Save the file
4. **Important**: Never commit `.env.local` to git (it's already in `.gitignore`)

---

## Step 5: Configure Authorized Domains

1. In Firebase Console → **Authentication** → **Settings** tab
2. Scroll to **"Authorized domains"**
3. Add your domains:
   - `localhost` (for development - should already be there)
   - Your production domain when you deploy (e.g., `yourapp.com`)

---

## Step 6: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:5173/login`

3. Click **"Continue with Google"**

4. You should see Google's OAuth consent screen

5. Select your Google account

6. After successful login, you'll be redirected to the main app

7. Your user photo and name should appear in the top-right corner

---

## Security Best Practices ✅

- ✅ API keys are in `.env.local` (not in code)
- ✅ `.env.local` is in `.gitignore`
- ✅ Firebase Auth handles all password security
- ✅ ID tokens are refreshed automatically
- ✅ Tokens are stored in memory (not localStorage)
- ✅ Protected routes require authentication

---

## Troubleshooting

### "Popup blocked" error
- Allow popups for `localhost` in your browser settings
- Or use the browser extension to allow popups

### "Configuration incomplete" warning in console
- Check that all environment variables are filled in `.env.local`
- Restart the dev server after updating `.env.local`

### "Unauthorized domain" error
- Add your domain to Authorized Domains in Firebase Console
- Make sure `localhost` is in the list for development

### User not persisting after refresh
- Check browser console for errors
- Ensure `zustand` persist middleware is working
- Clear browser cache and try again

---

## Next Steps

Once authentication is working:

1. **Add Custom Claims** (optional): Set user roles in Firebase
2. **Backend Integration**: Verify ID tokens on your backend server
3. **Firestore Rules**: Secure your database with authentication rules
4. **Analytics**: Enable Firebase Analytics to track user behavior

---

## Support

For issues or questions:
- Firebase Docs: https://firebase.google.com/docs/auth
- This project's GitHub: [Your repo URL]
