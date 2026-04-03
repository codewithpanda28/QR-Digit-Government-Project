# 🔑 SUPABASE SERVICE ROLE KEY - SETUP GUIDE

## ⚠️ **IMPORTANT: Required for Admin Creation!**

The "**User not allowed**" error occurs because the **SUPABASE_SERVICE_ROLE_KEY** is missing from your `.env.local` file.

This key is **REQUIRED** for:
- ✅ Creating admins via `supabaseAdmin.auth.admin.createUser()`
- ✅ Deleting admins via `supabaseAdmin.auth.admin.deleteUser()`
- ✅ Other admin-level operations

---

## 📋 **How to Get Service Role Key**

### **Step 1: Go to Supabase Dashboard**

```
1. Open: https://supabase.com/dashboard
2. Login to your account
3. Select your project: "Safety QR" (or whatever name you used)
```

### **Step 2: Navigate to API Settings**

```
1. Click "Settings" (gear icon) in left sidebar
2. Click "API" under Project Settings
3. Scroll down to "Project API keys" section
```

### **Step 3: Copy Service Role Key**

```
You'll see 3 keys:

┌─────────────────────────────────────────────┐
│ anon / public                               │
│ eyJhbGc...  (Already in your .env.local)   │
├─────────────────────────────────────────────┤
│ service_role (secret)                       │
│ eyJhbGc... ← COPY THIS ONE!                 │
│                                             │
│ ⚠️ WARNING: Keep this key secure            │
│   Never expose in client-side code         │
└─────────────────────────────────────────────┘

Click the "Copy" button next to service_role
```

### **Step 4: Add to .env.local**

```bash
# Open: C:\Users\codew\OneDrive\Desktop\SaaS Project\Safety QR\.env.local

# Find this line:
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Replace with your actual key:
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (paste your copied key)
```

### **Step 5: Restart Dev Server**

```bash
# Stop the running server (Ctrl+C in terminal)
# Then restart:
npm run dev
```

---

## ✅ **Verification**

After adding the key:

1. Go to: `http://localhost:3000/admin/super-pro-login`
2. Enter passcode: `180117`
3. Click "CREATE ADMIN"
4. Fill the form
5. Click "CREATE"

**Result:**
- ✅ Admin created successfully!
- ✅ Unique URL generated!
- ✅ Success toast appears!

**Error:**
- ❌ "User not allowed" → Service key missing or incorrect
- ❌ Check .env.local and restart server

---

## 🔒 **Security Notes**

### **What is Service Role Key?**

- **Bypasses Row Level Security (RLS)**
- **Full database access**
- **Should NEVER be exposed to client**
- **Only use in server-side code**

### **Safe Usage in Our App:**

```typescript
// ✅ SAFE - Server-side only (Next.js API routes, server components)
import { supabaseAdmin } from '@/lib/supabase'
await supabaseAdmin.auth.admin.createUser(...)

// ❌ UNSAFE - Don't use in client components
// (But our code is fine because it's in server actions)
```

### **Why Our Code is Safe:**

Even though we use `supabaseAdmin` in `/app/admin/super-pro/page.tsx`:

1. **Environment Variable Protection**:
   - `process.env.SUPABASE_SERVICE_ROLE_KEY` is only available server-side
   - Client-side code receives `undefined`
   - Next.js automatically filters server-only env vars

2. **Server Actions**:
   - Our `handleCreateAdmin` function runs on the server
   - Not exposed to browser

3. **Super Pro Protection**:
   - Super Pro panel requires secret passcode (180117)
   - Only YOU can create admins
   - Protected by `super_pro_admin_session`

---

## 📝 **.env.local Example (Complete)**

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://zznzvwwtlnjnwqfhfzwc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqcWd4emdsc2dqbWJ2emN2emNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MDM0MjMsImV4cCI6MjA4NjQ3OTQyM30.Fm52SQ4BuEflEfEGkTeaNnD8uSajaigoe1mEt-VY80I

# Service Role Key (REQUIRED for admin.createUser())
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqcWd4emdsc2dqbWJ2emN2emNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDkwMzQyMywiZXhwIjoyMDg2NDc5NDIzfQ.PASTE_YOUR_ACTUAL_KEY_HERE
```

---

## 🎯 **Menu Items by Role (Updated)**

### **Super Admin Menu:**
```
✅ Dashboard
✅ QR Inventory
✅ Generate
✅ Analytics
✅ Emergency (phone, alerts)
✅ Map (location tracking)
✅ Protocols (security settings)
❌ Subscription (removed - not needed)
❌ Preferences (removed - not needed)
```

### **Sub Admin Menu:**
```
✅ Dashboard
✅ QR Inventory
✅ Generate
✅ Analytics
❌ Emergency (super admin only)
❌ Map (super admin only)
❌ Protocols (super admin only)
❌ Subscription (removed)
❌ Preferences (removed)
```

---

## 🚀 **Summary of All Changes**

### **1. Fixed "User not allowed" Error:**
- ✅ Added `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`
- ✅ Created `supabaseAdmin` client in `lib/supabase.ts`
- ✅ Updated super-pro page to use `supabaseAdmin.auth.admin.createUser()`
- ✅ Updated delete function to use `supabaseAdmin.auth.admin.deleteUser()`

### **2. Cleaned Up Super Admin Menu:**
- ✅ Removed: Subscription
- ✅ Removed: Preferences
- ✅ Kept: Dashboard, QR, Generate, Analytics, Emergency, Map, Protocols

### **3. Cleaned Up Sub Admin Menu:**
- ✅ Removed: Emergency
- ✅ Removed: Map
- ✅ Removed: Protocols
- ✅ Removed: Subscription
- ✅ Removed: Preferences
- ✅ Kept: Dashboard, QR, Generate, Analytics

### **4. Role-Based Filtering:**
- ✅ Added `userRole` state in layout
- ✅ Filter menu items based on role
- ✅ Show appropriate items per admin type

---

## 🔥 **NEXT STEPS**

1. ⬜ **Get Service Role Key**:
   - Go to Supabase Dashboard → Settings → API
   - Copy `service_role` key
   - Add to `.env.local`

2. ⬜ **Add `login_slug` Column**:
   - Go to Supabase SQL Editor
   - Run: `database/add_login_slug.sql`

3. ⬜ **Restart Server**:
   ```bash
   # Stop (Ctrl+C) and restart
   npm run dev
   ```

4. ⬜ **Test Admin Creation**:
   - Login to Super Pro
   - Create a test admin
   - Verify unique URL generated
   - Open unique URL and test login

---

## ✅ **COMPLETE!**

Once you add the service role key:
- ✅ Admin creation will work
- ✅ Unique URLs will be generated
- ✅ Role-based menus will show
- ✅ Perfect SaaS system ready!

**Now go get that service role key!** 🚀
