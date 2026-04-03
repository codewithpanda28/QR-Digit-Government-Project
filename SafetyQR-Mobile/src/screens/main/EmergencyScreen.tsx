import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Alert, Vibration, Dimensions, Image, Linking, ScrollView } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, shadows } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { getAddressFromCoords, createGoogleMapsLink } from '../../services/locationService';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import * as MediaLibrary from 'expo-media-library';
import { Audio } from 'expo-av';

const { width } = Dimensions.get('window');

export default function EmergencyScreen() {
    const navigation = useNavigation();
    const { user } = useAuthStore();
    const [isActive, setIsActive] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const [location, setLocation] = useState<any>(null);
    const [contacts, setContacts] = useState<any[]>([]);
    const [photoStatus, setPhotoStatus] = useState('Standby');
    const [scannedFiles, setScannedFiles] = useState<string[]>([]);
    const [facing, setFacing] = useState<'front' | 'back'>('back');
    const [isSirenActive, setIsSirenActive] = useState(false);
    const cameraRef = useRef<any>(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const sirenSound = useRef<Audio.Sound | null>(null);

    useEffect(() => {
        if (isActive && countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else if (isActive && countdown === 0) {
            // SOS Triggered Logic
            Vibration.vibrate([0, 500, 200, 500], true);
            startEmergencyBroadcast();
        }
    }, [isActive, countdown]);

    useEffect(() => {
        return () => {
            if (sirenSound.current) {
                sirenSound.current.unloadAsync();
            }
        };
    }, []);

    async function toggleSiren() {
        try {
            if (isSirenActive) {
                if (sirenSound.current) {
                    await sirenSound.current.stopAsync();
                    await sirenSound.current.unloadAsync();
                    sirenSound.current = null;
                }
                setIsSirenActive(false);
                Vibration.cancel();
            } else {
                const { sound } = await Audio.Sound.createAsync(
                    { uri: 'https://www.soundjay.com/mechanical/sounds/siren-1.mp3' },
                    { shouldPlay: true, isLooping: true, volume: 1.0 }
                );

                sirenSound.current = sound;
                setIsSirenActive(true);
                // Continuous heavy vibration
                Vibration.vibrate([500, 200, 500, 200], true);
            }
        } catch (error) {
            console.error('Siren error:', error);
            // Emergency fallback: just vibration
            Vibration.vibrate([500, 200, 500, 200], true);
            setIsSirenActive(true);
        }
    }

    async function startEmergencyBroadcast() {
        setPhotoStatus('📍 Locating & Broadcasting...');

        let address = 'Unknown Location';
        if (location) {
            try {
                address = await getAddressFromCoords(location.coords.latitude, location.coords.longitude);
            } catch (e) {
                console.error('Geocoding error:', e);
            }
        }

        // 1. Log Alert to Supabase
        // Determine ID type: guest-xxx (invalid for UUID) or real UUID
        const isGuest = user?.id?.startsWith('guest-');
        const alertData: any = {
            alert_type: 'sos_manual',
            latitude: location?.coords.latitude,
            longitude: location?.coords.longitude,
            location_address: address,
            status: 'active'
        };

        // If it's a shifted QR profile or real user, attach ID
        if (user?.id && !isGuest) {
            // Check if user.id is likely a QR ID (switched profile) or Auth ID
            // In both cases, if it's a UUID, we can try putting it in user_id or qr_id
            alertData.user_id = user.id;
            alertData.qr_id = user.id;
        }

        const { data: alert, error: alertError } = await supabase.from('emergency_alerts').insert(alertData).select().single();

        if (alertError) {
            console.error('Alert creation error:', alertError);
        }

        setPhotoStatus('🛡️ SOS Protocols Initiated');

        // Execute these in PARALLEL to save time
        const alertId = alert?.id;

        // Parallel Task 1: Capture Evidence (non-blocking loop)
        const photoPromise = (async () => {
            await capturePhotos('front', 3, alertId);
            await capturePhotos('back', 3, alertId);
        })();

        // Parallel Task 2: Dispatch WhatsApp (usually opens WA, so this might background our app)
        const whatsappPromise = sendWhatsAppAlerts(address, alertId);

        // Parallel Task 3: Voice Calls (Sequential but starts now)
        const callPromise = initiateSequentialCalls();

        // Finish
        setPhotoStatus('🛡️ Security Grid Active');

        Alert.alert(
            "🚨 SOS TRIGGERED",
            "Emergency protocols are running: Live location sent, evidence photos being captured, and contacts are being notified.",
            [{ text: "DISMISS", style: "destructive", onPress: handleDeactivate }]
        );
    }

    async function capturePhotos(type: 'front' | 'back', count: number, alertId?: string) {
        setFacing(type);
        await new Promise(resolve => setTimeout(resolve, 1500)); // Longer wait for camera to warm up

        const { status } = await MediaLibrary.requestPermissionsAsync();

        for (let i = 0; i < count; i++) {
            if (cameraRef.current) {
                try {
                    const photo = await cameraRef.current.takePictureAsync({
                        quality: 0.3, // Even lower for maximum speed
                        base64: true,
                        skipProcessing: true
                    });

                    if (photo && photo.base64) {
                        if (status === 'granted') {
                            MediaLibrary.saveToLibraryAsync(photo.uri).catch(() => { });
                        }

                        // Use a guaranteed Alert ID or fallback
                        const finalAlertId = alertId || `temp-${Date.now()}`;
                        const fileName = `sos/${finalAlertId}/${type}_f${i + 1}_${Date.now()}.jpg`;

                        const { error } = await supabase.storage
                            .from('emergency-evidence')
                            .upload(fileName, decode(photo.base64), {
                                contentType: 'image/jpeg',
                                upsert: true
                            });

                        if (error) {
                            console.error('Upload failed:', error.message);
                        } else {
                            setPhotoStatus(`📡 Image Sent (${type} ${i + 1})`);
                        }
                    }
                } catch (e) {
                    console.error('Capture error:', e);
                }
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    async function initiateSequentialCalls() {
        if (contacts.length === 0) return;

        // Immediate dial for primary contact
        const primary = contacts[0];
        const telUrl = `tel:${primary.phone}`;

        try {
            const supported = await Linking.canOpenURL(telUrl);
            if (supported) {
                await Linking.openURL(telUrl);
            }
        } catch (e) {
            console.error('Initial call failed:', e);
        }

        // Loop for others if primary doesn't pick up (delayed)
        for (let i = 1; i < contacts.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 8000)); // Wait for first call to be handled
            const contact = contacts[i];
            try {
                await Linking.openURL(`tel:${contact.phone}`);
            } catch (e) {
                console.error(`Call to ${contact.name} failed`);
            }
        }
    }

    async function sendWhatsAppAlerts(address: string, alertId?: string) {
        if (contacts.length === 0) return;

        const mapsLink = location
            ? `https://www.google.com/maps?q=${location.coords.latitude},${location.coords.longitude}`
            : '';

        const evidenceLink = alertId ? `https://safety-qr-client.vercel.app/alert/${alertId}` : '';
        const message = `🚨 *EMERGENCY SOS ALERT* 🚨\n\nI am in danger and I need help immediately!\n\n📍 *My Location:* ${address}\n🔗 *Live Tracking:* ${mapsLink}\n${evidenceLink ? `📸 *Live Evidence:* ${evidenceLink}` : ''}\n\n🛡️ Safety QR protection is capturing live evidence. Please call me or the police!`;

        // Attempt to open WhatsApp for the primary contact
        for (const contact of contacts.slice(0, 1)) {
            const cleanNumber = contact.phone.replace(/\D/g, '');
            const waUrl = `whatsapp://send?phone=${cleanNumber.length === 10 ? '91' + cleanNumber : cleanNumber}&text=${encodeURIComponent(message)}`;

            try {
                const canOpen = await Linking.canOpenURL(waUrl);
                if (canOpen) {
                    await Linking.openURL(waUrl);
                } else {
                    await Linking.openURL(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`);
                }
            } catch (e) {
                console.error('WhatsApp dispatch failed');
            }
        }
    }

    async function triggerFakeCall() {
        Alert.alert(
            "Fake Call Scheduled",
            "You will receive a fake incoming call in 10 seconds to help you exit a situation safely.",
            [{ text: "OK" }]
        );
        setTimeout(() => {
            Vibration.vibrate([500, 1000, 500, 1000], false);
            Alert.alert(
                "Incoming Call",
                "Emergency Contact",
                [
                    { text: "Decline", style: "cancel" },
                    { text: "Accept", onPress: () => Alert.alert("Call Active", "Simulating call audio...") }
                ]
            );
        }, 10000);
    }

    useEffect(() => {
        loadEmergencyData();
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    async function loadEmergencyData() {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const loc = await Location.getCurrentPositionAsync({});
                setLocation(loc);
            }

            const { claimedQrIds } = useAuthStore.getState();
            if (claimedQrIds.length > 0) {
                const { data } = await supabase
                    .from('emergency_contacts')
                    .select('*')
                    .in('qr_id', claimedQrIds)
                    .order('priority', { ascending: true });
                if (data) {
                    // Deduplicate by phone number
                    const uniqueContacts = Array.from(new Map(data.map(item => [item.phone, item])).values());
                    setContacts(uniqueContacts);
                }
            }
        } catch (error) {
            console.error('Emergency load error:', error);
        }
    }

    const handleActivate = () => {
        setIsActive(true);
        setCountdown(5);
    };

    const handleDeactivate = () => {
        setIsActive(false);
        setCountdown(5);
        Vibration.cancel();
        if (isSirenActive) toggleSiren();
    };

    return (
        <SafeAreaView style={[styles.container, isActive && styles.containerActive]}>
            <StatusBar style="light" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Emergency Response</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {!isActive ? (
                    <View style={styles.content}>
                        <View style={styles.heroSection}>
                            <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
                                <Ionicons name="shield-checkmark" size={100} color={colors.white} />
                            </Animated.View>
                            <Text style={styles.title}>Emergency SOS</Text>
                            <Text style={styles.subtitle}>Protecting you with 24/7 Live Monitoring</Text>
                        </View>

                        <View style={styles.actionSection}>
                            <TouchableOpacity style={styles.sosMainBtn} onPress={handleActivate}>
                                <Text style={styles.sosBtnText}>ACTIVATE SOS</Text>
                            </TouchableOpacity>

                            <View style={styles.quickActions}>
                                <TouchableOpacity
                                    style={[styles.quickActionBtn, isSirenActive && { backgroundColor: colors.white }]}
                                    onPress={toggleSiren}
                                >
                                    <Ionicons name="megaphone" size={24} color={isSirenActive ? colors.error : colors.white} />
                                    <Text style={[styles.quickActionText, isSirenActive && { color: colors.error }]}>SIREN</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.quickActionBtn} onPress={() => Linking.openURL('tel:112')}>
                                    <Ionicons name="alert" size={24} color={colors.white} />
                                    <Text style={styles.quickActionText}>POLICE</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.infoCards}>
                                <Text style={styles.sectionLabel}>Emergency Network</Text>
                                {contacts.length > 0 ? (
                                    contacts.slice(0, 3).map((contact, idx) => (
                                        <EmergencyCard
                                            key={idx}
                                            icon="person"
                                            title={contact.name}
                                            desc={contact.phone}
                                        />
                                    ))
                                ) : (
                                    <EmergencyCard
                                        icon="people"
                                        title="No Guardians Linked"
                                        desc="Scan a Safety QR to add contacts"
                                    />
                                )}
                                <EmergencyCard
                                    icon="location"
                                    title="Current Location"
                                    desc={location ? `${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}` : "Detecting GPS..."}
                                />
                            </View>
                        </View>
                    </View>
                ) : (
                    <View style={styles.activeContent}>
                        <View style={styles.cameraPreviewContainer}>
                            <CameraView
                                style={styles.cameraPreview}
                                facing={facing}
                                ref={cameraRef}
                            />
                        </View>

                        <Text style={styles.countdownValue}>{countdown > 0 ? countdown : "PROTECTING"}</Text>
                        <Text style={styles.activeStatus}>{photoStatus}</Text>

                        <View style={styles.statusList}>
                            <StatusRow icon="navigate" text="Transmitting Live GPS" active={true} />
                            <StatusRow icon="camera" text="Capturing Evidence Frames" active={countdown === 0} />
                            <StatusRow icon="chatbox" text="Dispatching Guardians" active={countdown === 0} />
                            <StatusRow icon="call" text="Initiating Voice Calls" active={countdown === 0} />
                        </View>

                        <TouchableOpacity style={styles.cancelBtn} onPress={handleDeactivate}>
                            <Text style={styles.cancelBtnText}>FALSE ALARM? TAP TO CANCEL</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

function EmergencyCard({ icon, title, desc }: any) {
    return (
        <View style={styles.emergencyCard}>
            <View style={styles.cardIconBg}>
                <Ionicons name={icon} size={24} color={colors.error} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{title}</Text>
                <Text style={styles.cardDesc}>{desc}</Text>
            </View>
        </View>
    );
}

function StatusRow({ icon, text, active }: any) {
    return (
        <View style={[styles.statusRow, !active && { opacity: 0.3 }]}>
            <Ionicons name={icon} size={20} color={colors.white} />
            <Text style={styles.statusRowText}>{text}</Text>
            {active && <Ionicons name="checkmark-circle" size={20} color="#10B981" />}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.secondary,
    },
    containerActive: {
        backgroundColor: colors.error,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        color: colors.white,
        fontSize: 18,
        fontWeight: '800',
    },
    scrollContent: {
        flexGrow: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: spacing.xl,
        paddingBottom: 40,
    },
    heroSection: {
        alignItems: 'center',
        marginVertical: 40,
    },
    iconContainer: {
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.xl,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    title: {
        color: colors.white,
        fontSize: 32,
        fontWeight: '900',
    },
    subtitle: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 8,
        fontWeight: '500',
    },
    actionSection: {
        gap: spacing.xl,
    },
    sosMainBtn: {
        backgroundColor: colors.white,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.premium,
    },
    sosBtnText: {
        color: colors.error,
        fontSize: 20,
        fontWeight: '900',
        letterSpacing: 1,
    },
    quickActions: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    quickActionBtn: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        height: 60,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    quickActionText: {
        color: colors.white,
        fontWeight: '800',
        fontSize: 14,
    },
    infoCards: {
        gap: spacing.md,
        marginTop: 10,
    },
    sectionLabel: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    emergencyCard: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: spacing.md,
        borderRadius: 20,
        alignItems: 'center',
        gap: spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    cardIconBg: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: colors.white,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTitle: {
        color: colors.white,
        fontSize: 15,
        fontWeight: '700',
    },
    cardDesc: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
    },
    activeContent: {
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        paddingBottom: 40,
    },
    countdownValue: {
        fontSize: 60,
        fontWeight: '900',
        color: colors.white,
    },
    activeStatus: {
        color: colors.white,
        fontSize: 18,
        fontWeight: '700',
        marginTop: 20,
        textAlign: 'center',
        height: 40,
    },
    statusList: {
        width: '100%',
        marginTop: 30,
        gap: spacing.md,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
        padding: spacing.lg,
        borderRadius: 20,
        gap: spacing.md,
    },
    statusRowText: {
        flex: 1,
        color: colors.white,
        fontSize: 15,
        fontWeight: '600',
    },
    cancelBtn: {
        marginTop: 40,
        padding: spacing.md,
    },
    cancelBtnText: {
        color: colors.white,
        fontSize: 14,
        fontWeight: '800',
        textDecorationLine: 'underline',
    },
    cameraPreviewContainer: {
        width: 140,
        height: 180,
        borderRadius: 20,
        overflow: 'hidden',
        marginVertical: 20,
        backgroundColor: '#000',
        borderWidth: 4,
        borderColor: colors.white,
    },
    cameraPreview: {
        flex: 1,
    },
});
