---
description: Mobile App Setup and Fixes
---

# Mobile App Repair & Setup Workflow

Follow these steps to ensure your mobile app works perfectly:

## 1. Database Setup (CRITICAL)
// turbo
1. Open your Supabase Dashboard.
2. Go to the **SQL Editor**.
3. Create a new query.
4. Copy and paste the content of `MOBILE_APP_DATABASE_SETUP.sql` (located in your project root).
5. Click **Run**.
> This creates the necessary tables (`app_users`, `emergency_contacts`, etc.) and Row Level Security (RLS) policies. Without this, login/registration will fail.

## 2. Authentication Testing
// turbo
1. Start the mobile app: `npx expo start`.
2. Open the app on your phone (Expo Go) or emulator.
3. Try the **Registration** flow first.
4. If it fails, check the error message on the screen (I've improved these to be very specific).

## 3. QR Code Scanning
1. Use the **Scan to Begin** button on the Welcome screen.
2. Scan any QR code.
3. Choose **Register Tag** to pre-fill the registration form with that QR ID.

## 4. SOS Testing
1. Once logged in, the SOS button on the Home screen will navigate you to the Emergency screen.
2. Note: SMS and Email alerts require backend API configuration (AWS/Twilio).
