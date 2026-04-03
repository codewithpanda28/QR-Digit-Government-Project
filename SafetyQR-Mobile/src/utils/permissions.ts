import * as Location from 'expo-location';
import { Camera } from 'expo-camera';
import * as Notifications from 'expo-notifications';
import { Alert, Platform } from 'react-native';

export interface PermissionsStatus {
    location: boolean;
    backgroundLocation: boolean;
    camera: boolean;
    notifications: boolean;
}

export async function requestPermissions(): Promise<PermissionsStatus> {
    const status: PermissionsStatus = {
        location: false,
        backgroundLocation: false,
        camera: false,
        notifications: false,
    };

    try {
        // Request Location Permission
        const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
        status.location = locationStatus === 'granted';

        if (status.location) {
            // Request Background Location Permission
            const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
            status.backgroundLocation = backgroundStatus === 'granted';

            if (!status.backgroundLocation) {
                Alert.alert(
                    'Background Location',
                    'Background location is required for emergency tracking even when the app is closed. Please enable "Always Allow" in settings.',
                    [{ text: 'OK' }]
                );
            }
        } else {
            Alert.alert(
                'Location Permission Required',
                'Location permission is required for safety features. Please enable it in settings.',
                [{ text: 'OK' }]
            );
        }

        // Request Camera Permission
        const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
        status.camera = cameraStatus === 'granted';

        if (!status.camera) {
            Alert.alert(
                'Camera Permission Required',
                'Camera permission is required for QR scanning and emergency photo capture.',
                [{ text: 'OK' }]
            );
        }

        // Request Notification Permission
        const { status: notificationStatus } = await Notifications.requestPermissionsAsync();
        status.notifications = notificationStatus === 'granted';

        if (!status.notifications) {
            Alert.alert(
                'Notification Permission Required',
                'Notification permission is required for emergency alerts.',
                [{ text: 'OK' }]
            );
        }

    } catch (error) {
        console.error('Error requesting permissions:', error);
    }

    return status;
}

export async function checkPermissions(): Promise<PermissionsStatus> {
    const status: PermissionsStatus = {
        location: false,
        backgroundLocation: false,
        camera: false,
        notifications: false,
    };

    try {
        // Check Location
        const { status: locationStatus } = await Location.getForegroundPermissionsAsync();
        status.location = locationStatus === 'granted';

        // Check Background Location
        const { status: backgroundStatus } = await Location.getBackgroundPermissionsAsync();
        status.backgroundLocation = backgroundStatus === 'granted';

        // Check Camera
        const { status: cameraStatus } = await Camera.getCameraPermissionsAsync();
        status.camera = cameraStatus === 'granted';

        // Check Notifications
        const { status: notificationStatus } = await Notifications.getPermissionsAsync();
        status.notifications = notificationStatus === 'granted';

    } catch (error) {
        console.error('Error checking permissions:', error);
    }

    return status;
}

export async function requestCameraPermission(): Promise<boolean> {
    try {
        const { status } = await Camera.requestCameraPermissionsAsync();
        return status === 'granted';
    } catch (error) {
        console.error('Error requesting camera permission:', error);
        return false;
    }
}

export async function requestLocationPermission(): Promise<boolean> {
    try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        return status === 'granted';
    } catch (error) {
        console.error('Error requesting location permission:', error);
        return false;
    }
}

export async function requestBackgroundLocationPermission(): Promise<boolean> {
    try {
        const { status } = await Location.requestBackgroundPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert(
                'Background Location Required',
                'To enable continuous safety monitoring, please allow location access "Always" in your device settings.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Open Settings',
                        onPress: () => {
                            if (Platform.OS === 'ios') {
                                // Linking.openURL('app-settings:');
                            } else {
                                // Linking.openSettings();
                            }
                        }
                    }
                ]
            );
        }

        return status === 'granted';
    } catch (error) {
        console.error('Error requesting background location permission:', error);
        return false;
    }
}
