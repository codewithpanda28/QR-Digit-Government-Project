import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, Linking, Alert } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, shadows } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { getAddressFromCoords } from '../../services/locationService';

export default function MapScreen() {
    const { user } = useAuthStore();
    const [location, setLocation] = useState<any>(null);
    const [address, setAddress] = useState('Locating...');
    const [history, setHistory] = useState<any[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const mapRef = useRef<MapView>(null);

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;

            const watcher = await Location.watchPositionAsync(
                { accuracy: Location.Accuracy.High, distanceInterval: 10 },
                async (loc) => {
                    setLocation(loc);
                    const addr = await getAddressFromCoords(loc.coords.latitude, loc.coords.longitude);
                    setAddress(addr);
                    setHistory(prev => [...prev, loc.coords].slice(-50));
                }
            );

            return () => watcher.remove();
        })();
    }, []);

    const centerOnUser = () => {
        if (location && mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
            });
        }
    };

    const findPOI = (type: string) => {
        if (!location) {
            Alert.alert("Locating...", "Please wait for GPS lock.");
            return;
        }
        const { latitude, longitude } = location.coords;
        const query = type === 'police' ? 'Police Station' : 'Hospital';
        const url = Platform.select({
            ios: `maps:0,0?q=${query}&ll=${latitude},${longitude}`,
            android: `geo:0,0?q=${query}(${latitude},${longitude})`,
            default: `https://www.google.com/maps/search/${query}/@${latitude},${longitude}`
        });
        Linking.openURL(url);
    };

    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                style={[StyleSheet.absoluteFillObject, { marginTop: 0 }]}
                initialRegion={{
                    latitude: 20.5937,
                    longitude: 78.9629,
                    latitudeDelta: 10,
                    longitudeDelta: 10,
                }}
                showsUserLocation={true}
                showsMyLocationButton={false}
                showsCompass={true}
                onMapReady={() => {
                    if (location) centerOnUser();
                }}
            >
                {location && (
                    <Marker
                        coordinate={location.coords}
                        title="Your Orbit"
                        description={address}
                    >
                        <View style={styles.userMarker}>
                            <View style={styles.userMarkerPulse} />
                            <Ionicons name="shield-checkmark" size={20} color={colors.white} />
                        </View>
                    </Marker>
                )}

                {showHistory && history.length > 1 && (
                    <Polyline
                        coordinates={history}
                        strokeWidth={4}
                        strokeColor={colors.primary}
                        lineDashPattern={[5, 5]}
                    />
                )}
            </MapView>

            {/* Address Bar */}
            <View style={styles.topContainer}>
                <View style={styles.addressCard}>
                    <Ionicons name="location" size={20} color={colors.primary} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.addressTitle}>Current Protection Orbit</Text>
                        <Text style={styles.addressText} numberOfLines={2}>{address}</Text>
                    </View>
                    <TouchableOpacity onPress={centerOnUser} style={styles.miniFab}>
                        <Ionicons name="refresh" size={18} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                {/* Quick POI */}
                <View style={styles.poiBar}>
                    <TouchableOpacity style={[styles.poiBtn, { backgroundColor: colors.primary }]} onPress={() => findPOI('police')}>
                        <Ionicons name="shield-outline" size={18} color={colors.white} />
                        <Text style={styles.poiText}>Police</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.poiBtn, { backgroundColor: colors.error }]} onPress={() => findPOI('hospital')}>
                        <Ionicons name="medical-outline" size={18} color={colors.white} />
                        <Text style={styles.poiText}>Hospital</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Controls */}
            <View style={styles.controls}>
                <TouchableOpacity
                    style={styles.controlBtn}
                    onPress={() => {
                        if (location) {
                            const link = `https://www.google.com/maps?q=${location.coords.latitude},${location.coords.longitude}`;
                            const msg = `🚨 EMERGENCY ORBIT: My live location is ${address}. Tracks: ${link}`;
                            Linking.openURL(`whatsapp://send?text=${encodeURIComponent(msg)}`);
                        } else {
                            Alert.alert("Locating...", "Please wait while we lock your coordinates.");
                        }
                    }}
                >
                    <Ionicons name="share-social-outline" size={24} color={colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.controlBtn} onPress={() => setShowHistory(!showHistory)}>
                    <Ionicons name={showHistory ? "eye-off" : "trail-sign-outline"} size={24} color={colors.secondary} />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.controlBtn, styles.primaryControl]} onPress={centerOnUser}>
                    <Ionicons name="navigate" size={24} color={colors.white} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    map: {
        width: '100%',
        height: '100%',
        ...StyleSheet.absoluteFillObject,
    },
    topContainer: {
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
    },
    addressCard: {
        backgroundColor: colors.white,
        borderRadius: 20,
        padding: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        ...shadows.medium,
    },
    addressTitle: {
        fontSize: 10,
        fontWeight: '800',
        color: colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    addressText: {
        fontSize: 13,
        color: colors.secondary,
        fontWeight: '600',
    },
    controls: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        gap: 12,
    },
    controlBtn: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.medium,
    },
    primaryControl: {
        backgroundColor: colors.primary,
    },
    miniFab: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    poiBar: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 12,
    },
    poiBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
        ...shadows.soft,
    },
    poiText: {
        color: colors.white,
        fontSize: 12,
        fontWeight: '700',
    },
    userMarker: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: colors.white,
    },
    userMarkerPulse: {
        position: 'absolute',
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.primary,
        opacity: 0.2,
    },
});
