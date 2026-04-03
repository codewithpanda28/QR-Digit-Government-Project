# 🔧 Complete Mobile App Fix - Implementation Plan

## Priority 1: ✅ COMPLETED - Navigation & Welcome Screen

### ✅ Fixed:
1. **Welcome Screen हमेशा दिखता है** - App open होने पर
2. **दो clear buttons**:
   - "Scan Safety QR" - Admin/Sub-admin QR scan करने के लिए
   - "My Dashboard" - Dashboard access के लिए

---

## Priority 2: 🔄 IN PROGRESS - QR Scanner & Form Integration

### Issues to Fix:
1. ❌ Safety QR scan करने पर form properly open नहीं हो रहा
2. ❌ Form data save और display नहीं हो रहा

### Solution:
- SafetyQRViewer को enhance करना होगा
- Web form integration properly करनी होगी
- या mobile में ही form बनानी होगी (recommended)

---

## Priority 3: Home Screen Real Data

### Current Issues:
- ❌ Dummy data दिख रहा है
- ❌ User का नाम गलत है
- ❌ User की image नहीं है
- ❌ Device diagnostics में dummy data है
- ❌ Security modules काम नहीं कर रहे
- ❌ Safety logs में dummy data है

### Required Changes in HomeScreen.tsx:

#### 1. User Information (Lines 15, 26, 38):
```typescript
// Current (Dummy):
const { user, familyProfiles } = useAuthStore();
<Text>{user?.full_name || 'Safety User'}</Text>

// Fix Required:
- Fetch real user from Supabase
- Add user profile image
- Display actual name from database
```

#### 2. Device Diagnostics (Lines 70-74):
```typescript
// Current (Dummy):
<DiagItem icon="location" label="GPS" value="High Prec." />
<DiagItem icon="cellular" label="Signal" value="4G Logged" />

// Fix Required:
- Get real GPS location using expo-location
- Get actual network signal
- Get real battery level
- Get cloud sync status from Supabase
```

#### 3. Security Modules (Lines 96-123):
```typescript
// Current (Dummy Alerts):
title="AI Watch" onPress={() => Alert.alert(...)}

// Fix Required:
- Actually implement features or link to real screens
- Remove dummy alerts
- Add real functionality navigation
```

#### 4. Safety Logs (Lines 135-137):
```typescript
// Current (Hard-coded):
<LogItem text="Location sync completed successfully" />

// Fix Required:
- Fetch from scan_logs table
- Fetch from emergency_alerts table
- Display real activity with timestamps
```

---

## Priority 4: Map & Live Tracking

### Issues:
- ❌ Live tracking नहीं आ रहा
- ❌ Google Maps API key चाहिए

### Solution Steps:
1. Add Google Maps API key to `.env`
2. Implement real-time location tracking
3. Show live location on map
4. Update location to Supabase database

### Files to Update:
- `MapScreen.tsx`
- `.env` file

---

## Priority 5: SOS Emergency Feature

### Required Features:
1. ✅ Emergency contacts को WhatsApp message
2. ✅ Live location sharing
3. ❌ Camera (front/back) capture
4. ❌ Super admin/Sub admin को alert
5. ❌ Nearby police, hospital, women police station दिखाना

### Implementation Required:
```typescript
// Emergency Flow:
1. User presses SOS button
2. Get current location
3. Capture photo (front camera)
4. Capture photo (back camera)
5. Send WhatsApp to emergency contacts
6. Send alert to Supabase (admin will see)
7. Find nearby services using Google Places API
8. Display emergency services on map
```

### New Permissions Required:
- Camera permission
- Location permission (already exists)

---

## Priority 6: Profile Screen

### Issues:
- ❌ Data auto-fill नहीं हो रहा
- ❌ Edit functionality नहीं है

### Files to Fix:
- `ProfileScreen.tsx`

### Required Changes:
```typescript
// Current: Static UI
// Fix: 
1. Fetch user data from Supabase
2. Pre-fill all fields
3. Add edit mode
4. Save updates to database
5. Update authStore
```

---

## Priority 7: Passcode & Authentication

### Issues:
- ❌ Passcode काम नहीं कर रहा
- ❌ Sign out काम नहीं कर रहा

### Files to Fix:
- `PasscodeScreen.tsx`
- `authStore.ts`
- `ProfileScreen.tsx` (sign out button)

### Required Changes:
```typescript
// Passcode:
1. Create/verify passcode
2. Lock/unlock app
3. Store in AsyncStorage

// Sign Out:
1. Clear authStore
2. Clear AsyncStorage
3. Navigate to Welcome screen
4. Clear Supabase session
```

---

## Implementation Priority Order

### Phase 1 (Immediate - Today):
1. ✅ Navigation fix (DONE)
2. 🔄 Safety QR → Form opening (IN PROGRESS)
3. Home Screen real data
4. Profile auto-fill & edit

### Phase 2 (Next):
5. Map live tracking
6. Passcode & Sign out
7. Safety logs real data

### Phase 3 (Advanced):
8. Full SOS implementation
9. Camera capture
10. Admin alerts
11. Nearby services

---

## Files That Need Major Updates

### Critical:
1. `src/screens/main/HomeScreen.tsx` - Remove dummy data
2. `src/screens/main/ProfileScreen.tsx` - Add edit functionality
3. `src/screens/main/MapScreen.tsx` - Implement live tracking
4. `src/screens/main/EmergencyScreen.tsx` - Full SOS feature
5. `src/screens/auth/PasscodeScreen.tsx` - Fix passcode
6. `src/store/authStore.ts` - Add real user data methods

### Medium Priority:
7. `src/screens/SafetyQRViewerScreen.tsx` - Form integration
8. `src/screens/EmergencyContactsScreen.tsx` - CRUD operations
9. `src/screens/GeofencesScreen.tsx` - Geofence management
10. `src/screens/SettingsScreen.tsx` - App settings

---

## Database Tables Needed

### Already Exist:
- `app_users` - User profiles
- `emergency_contacts` - Emergency contacts
- `emergency_alerts` - SOS alerts
- `location_history` - Location tracking
- `qr_codes` - QR code data
- `qr_details` - QR details
- `scan_logs` - Scan history

### May Need to Add:
- `app_settings` - User app settings
- `geofences` - Safe zone boundaries
- `sos_media` - SOS photos/videos

---

## Environment Variables Required

```env
# .env file
EXPO_PUBLIC_SUPABASE_URL=https://zznzvwwtlnjnwqfhfzwc.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key
EXPO_PUBLIC_API_URL=http://localhost:3000/api
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key  # ← ADD THIS
```

---

## Next Steps

### Step 1: Fix Home Screen Dummy Data
```bash
# Update HomeScreen.tsx to use real data from:
- useAuthStore (user info)
- expo-location (GPS)
- expo-battery (battery level)
- Supabase (scan logs, alerts)
```

### Step 2: Implement Profile Edit
```bash
# Update ProfileScreen.tsx:
- Fetch user data
- Enable edit mode
- Save to Supabase
- Add image upload
```

### Step 3: Fix Authentication
```bash
# Fix PasscodeScreen.tsx
# Add sign out in ProfileScreen.tsx
```

### Step 4: Google Maps Integration
```bash
# Get Google Maps API key from user
# Update MapScreen.tsx
# Implement live tracking
```

---

## Testing Checklist

- [ ] Welcome screen दिख रहा है हमेशा
- [ ] Scan Safety QR button काम कर रहा
- [ ] Dashboard button काम कर रहा
- [ ] Safety QR scan → Form opens
- [ ] Form data saves properly
- [ ] Home screen real user data
- [ ] Device diagnostics real data
- [ ] Security modules work
- [ ] Safety logs real data
- [ ] Map shows live location
- [ ] SOS sends messages
- [ ] Profile edit works
- [ ] Passcode works
- [ ] Sign out works

---

**मैं अब step by step implement करूंगा। पहले Home Screen का dummy data fix करता हूं।**
