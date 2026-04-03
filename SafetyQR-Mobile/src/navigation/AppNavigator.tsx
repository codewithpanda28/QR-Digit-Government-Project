import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { colors } from '../constants/theme';

// Auth & Security Screens
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import QRScannerScreen from '../screens/auth/QRScannerScreen';
import PasscodeScreen from '../screens/auth/PasscodeScreen';

// Main Screens
import HomeScreen from '../screens/main/HomeScreen';
import MapScreen from '../screens/main/MapScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import EmergencyScreen from '../screens/main/EmergencyScreen';

// Other Screens
import EmergencyContactsScreen from '../screens/EmergencyContactsScreen';
import GeofencesScreen from '../screens/GeofencesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import EmergencyServicesScreen from '../screens/EmergencyServicesScreen';
import SafetyQRViewerScreen from '../screens/SafetyQRViewerScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: keyof typeof Ionicons.glyphMap = 'home';

                    if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
                    else if (route.name === 'Map') iconName = focused ? 'map' : 'map-outline';
                    else if (route.name === 'Emergency') iconName = focused ? 'alert-circle' : 'alert-circle-outline';
                    else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textMuted,
                tabBarStyle: { height: 65, paddingBottom: 10, paddingTop: 10 },
                headerShown: false,
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Map" component={MapScreen} />
            <Tab.Screen name="Emergency" component={EmergencyScreen} options={{ tabBarLabel: 'SOS' }} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
}

export default function AppNavigator() {
    const { isLoading, checkSession, isLocked, passcode } = useAuthStore();

    React.useEffect(() => {
        checkSession();
    }, []);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ marginTop: 16, color: colors.textSecondary, fontWeight: '700' }}>Loading...</Text>
            </View>
        );
    }

    // New Simplified Flow: Always show Welcome screen with options
    // User can choose to scan Safety QR or go to Dashboard
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Passcode" component={PasscodeScreen} />
            <Stack.Screen name="QRScanner" component={QRScannerScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen name="SafetyQRViewer" component={SafetyQRViewerScreen} />
            <Stack.Screen name="MainTabs" component={MainTabs} />


            <Stack.Screen name="EmergencyContacts" component={EmergencyContactsScreen} options={{ headerShown: true, title: 'Emergency Contacts' }} />
            <Stack.Screen name="Geofences" component={GeofencesScreen} options={{ headerShown: true, title: 'Safe Zones' }} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: true, title: 'Settings' }} />
            <Stack.Screen name="EmergencyServices" component={EmergencyServicesScreen} options={{ headerShown: true, title: 'Emergency Services' }} />
        </Stack.Navigator>
    );
}
