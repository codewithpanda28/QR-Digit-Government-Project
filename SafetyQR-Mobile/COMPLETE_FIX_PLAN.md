# 🚀 All Issues Fix - Complete Task List

## ✅ COMPLETED

### 1. Navigation & Welcome Screen
- [x] Welcome screen हमेशा दिखता है
- [x] "Scan Safety QR" button
- [x] "My Dashboard" button
- [x] Clear navigation flow

---

## 🔴 HIGH PRIORITY (Fix करना है अब)

### 2. Safety QR Form Integration ✅ (Already Working!)
**Status**: SafetyQRViewer properly redirects to browser for form
- [x] "Setup Required" screen shows for `generated` QR
- [x] "Open Setup Form in Browser" button opens web form
- [x] Form data once filled shows in app

**No changes needed - this is working correctly!**

---

### 3. Home Screen - Remove Dummy Data

**Current Issues**:
```typescript
// src/screens/main/HomeScreen.tsx

// Line 26-27: Dummy user name
<Text style={styles.userName}>Hi, {user?.full_name || 'Safety User'}!</Text>
// Fix: Use real user from authStore ✓

// Line 38: No user image
// Fix: Add profile image from database or default avatar

// Lines 70-74: Dummy Device Diagnostics
<DiagItem icon="location" label="GPS" value="High Prec." />
// Fix: Get real GPS accuracy from expo-location

<DiagItem icon="cellular" label="Signal" value="4G Logged" />
// Fix: Get real network info (hard on mobile - can show "Connected")

<DiagItem icon="battery-charging" label="Battery" value="94%" />
// Fix: Get from expo-battery

<DiagItem icon="cloud-done" label="Cloud" value="Synced" />
// Fix: Check last sync time from Supabase

// Lines 135-137: Dummy Safety Logs
<LogItem icon="checkmark-circle" text="Location sync completed successfully" />
// Fix: Fetch from emergency_alerts or scan_logs table
```

**Files to modify**:
- `src/screens/main/HomeScreen.tsx`

**Dependencies needed**:
```bash
npx expo install expo-battery expo-location
```

---

### 4. Security Modules - Make Functional

**Current**: All show dummy alerts
```typescript
// Lines 96-123 में सभी features

<FeatureItem
    icon="eye"
    title="AI Watch"
    subtitle="Pattern Detection"
    color="#6366F1"
    onPress={() => Alert.alert(...)}  // ← Dummy
/>
```

**Fix Options**:
1. **Simple**: Navigate to placeholder screens
2. **Advanced**: Implement actual features

**Files to create** (if implementing):
- `src/screens/features/AIWatchScreen.tsx`
- `src/screens/features/VoiceGuardScreen.tsx`
- `src/screens/features/SafeZoneScreen.tsx` (or use existing GeofencesScreen)
- `src/screens/features/FamilyLinkScreen.tsx`

---

### 5. Profile Screen - Real Data & Edit

**Current Issues**:
```typescript
// Profile screen doesn't fetch user data
// No edit mode
// No image upload
// No save functionality
```

**Required Changes in ProfileScreen.tsx**:
```typescript
// 1. Fetch user data on load
useEffect(() => {
    loadUserProfile();
}, []);

// 2. Add edit mode state
const [isEditing, setIsEditing] = useState(false);

// 3. Form fields with values
<TextInput value={fullName} onChangeText={setFullName} editable={isEditing} />

// 4. Save to Supabase
const handleSave = async () => {
    await supabase.from('app_users').update({...}).eq('id', user.id);
    await authStore.updateProfile({...});
};

// 5. Image picker
import * as ImagePicker from 'expo-image-picker';
```

---

### 6. Passcode & Sign Out

#### Passcode Fix (PasscodeScreen.tsx):
```typescript
// Current issue: passcode not persisting properly
// Fix authStore methods already exist, just need to verify flow

Steps:
1. Create passcode → setPasscode()
2. Verify passcode → unlock()
3. App lock on background → lock()
```

#### Sign Out Fix (ProfileScreen.tsx):
```typescript
// Add sign out button
<TouchableOpacity onPress={handleSignOut}>
    <Text>Sign Out</Text>
</TouchableOpacity>

const handleSignOut = async () => {
    await authStore.logout();
    await AsyncStorage.clear();  // Clear all local data
    navigation.navigate('Welcome');
};
```

---

## 🟡 MEDIUM PRIORITY

### 7. Safety Logs - Real Data

**Fetch from Supabase**:
```typescript
// In HomeScreen.tsx
const [safetyLogs, setSafetyLogs] = useState([]);

useEffect(() => {
    loadSafetyLogs();
}, []);

async function loadSafetyLogs() {
    // Fetch from emergency_alerts
    const { data: alerts } = await supabase
        .from('emergency_alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { descending: true })
        .limit(3);
    
    // Fetch from scan_logs if it exists
    // Or create activity logs
    setSafetyLogs(alerts || []);
}
```

---

### 8. Map Live Tracking

**Required**:
1. Google Maps API Key (user will provide)
2. Real-time location updates
3. Location permission

**Files to Update**:
- `src/screens/main/MapScreen.tsx`
- `.env` file

**Implementation**:
```typescript
// MapScreen.tsx
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

const [location, setLocation] = useState(null);
const [watchId, setWatchId] = useState(null);

useEffect(() => {
    startLocationTracking();
    return () => stopLocationTracking();
}, []);

async function startLocationTracking() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
        const id = await Location.watchPositionAsync(
            { accuracy: Location.Accuracy.High, distanceInterval: 10 },
            (loc) => {
                setLocation(loc);
                // Update Supabase
                updateLocationInDatabase(loc);
            }
        );
        setWatchId(id);
    }
}
```

---

## 🟢 ADVANCED FEATURES

### 9. Complete SOS Implementation

**Current**: Basic WhatsApp message
**Required**: Full emergency system

**Features to Add**:

#### A. Camera Capture
```typescript
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';

async function captureSelfie() {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status === 'granted') {
        const photo = await camera.takePictureAsync();
        // Upload to Supabase storage
        uploadToSupabase(photo.uri);
    }
}
```

#### B. Admin Dashboard Alert
```typescript
// When SOS is triggered
async function triggerSOS() {
    // 1. Create emergency alert
    const { data: alert } = await supabase
        .from('emergency_alerts')
        .insert({
            user_id: user.id,
            alert_type: 'SOS',
            location: currentLocation,
            status: 'active',
            created_at: new Date()
        })
        .select()
        .single();
    
    // 2. Send to admin (real-time subscription will catch this)
    // Admins should have real-time listener on emergency_alerts table
    
    // 3. Capture photos
    const selfie = await captureSelfie();
    const backPhoto = await captureBackCamera();
    
    // 4. Send WhatsApp to contacts
    emergencyContacts.forEach(contact => {
        sendWhatsApp(contact.phone, alert);
    });
    
    // 5. Find nearby services
    const services = await findNearbyServices(currentLocation);
}
```

#### C. Nearby Services (Google Places API)
```typescript
async function findNearbyServices(location) {
    const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    // Police stations
    const police = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.latitude},${location.longitude}&radius=5000&type=police&key=${API_KEY}`
    );
    
    // Hospitals
    const hospitals = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.latitude},${location.longitude}&radius=5000&type=hospital&key=${API_KEY}`
    );
    
    return { police: await police.json(), hospitals: await hospitals.json() };
}
```

---

## 📋 Implementation Order

### Phase 1 (Today - Immediate):
1. ✅ Navigation fix (DONE)
2. ✅ Safety QR form (ALREADY WORKING)
3. 🔄 Home Screen dummy data → real data
4. 🔄 Profile edit functionality
5. 🔄 Passcode fix
6. 🔄 Sign out fix

### Phase 2 (Tomorrow):
7. Safety logs real data
8. Security modules navigation
9. Device diagnostics real data

### Phase 3 (Advanced):
10. Map live tracking (needs API key)
11. Full SOS with camera
12. Admin alerts
13. Nearby services

---

## 📦 Dependencies To Install

```bash
# For real device data
npx expo install expo-battery
npx expo install expo-location

# For profile image
npx expo install expo-image-picker

# For camera (SOS feature)
npx expo install expo-camera

# Already installed:
# - @react-navigation/*
# - @supabase/supabase-js
# - zustand
```

---

## 🎯 Priority Tasks For Now

**मैं अभी ये fix करूंगा** (एक-एक करके):

1. **HomeScreen Dummy Data** → Real user data, battery, GPS
2. **Profile Edit** → Fetch + Edit + Save functionality
3. **Passcode** → Verify it's working
4. **Sign Out** → Add button in profile
5. **Safety Logs** → Fetch from Supabase

**बताओ - क्या मैं इन्हें एक-एक करके fix करूं?** या कोई specific priority है?
