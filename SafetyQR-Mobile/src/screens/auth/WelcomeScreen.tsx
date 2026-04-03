import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
    StatusBar,
    TouchableOpacity,
    Platform,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, shadows } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
    const navigation = useNavigation();
    const { hasScannedQR } = useAuthStore();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    const handleScanPress = () => {
        console.log('=== SCAN BUTTON PRESSED ===');
        navigation.navigate('QRScanner' as never);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <View style={styles.bgCircle} />

            <Animated.View
                style={[
                    styles.content,
                    { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
                ]}
            >
                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="shield-checkmark" size={70} color={colors.white} />
                    </View>
                    <Text style={styles.brandTitle}>SafetyQR</Text>
                    <Text style={styles.tagline}>Advanced Personal Protection</Text>
                </View>

                {/* Info Cards */}
                <View style={styles.infoSection}>
                    <InfoRow
                        icon="shield-checkmark-outline"
                        title="Safety QR Scanner"
                        desc="Scan admin QR codes to view emergency profiles"
                    />
                    <InfoRow
                        icon="scan-outline"
                        title="Device Activation"
                        desc="One-time device QR scan for app setup"
                    />
                    <InfoRow
                        icon="speedometer-outline"
                        title="Quick Access"
                        desc="Instant emergency contact and profile viewing"
                    />
                </View>

                {/* Action Footer */}
                <View style={styles.footer}>
                    {/* Scan Safety QR Button */}
                    <TouchableOpacity
                        style={styles.primaryBtn}
                        onPress={handleScanPress}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="qr-code-outline" size={24} color={colors.white} style={{ marginRight: 12 }} />
                        <Text style={styles.primaryBtnText}>Scan Safety QR</Text>
                    </TouchableOpacity>

                    {/* Dashboard Button - Always visible */}
                    <TouchableOpacity
                        style={styles.dashboardBtn}
                        onPress={() => {
                            const { passcode, hasScannedQR, claimedQrIds } = useAuthStore.getState();

                            // 1. If scanned and passcode exists, ask to unlock
                            if (passcode && (hasScannedQR || (claimedQrIds && claimedQrIds.length > 0))) {
                                navigation.navigate('Passcode' as never);
                                return;
                            }

                            // 2. If scanned but no passcode, force setup
                            if (hasScannedQR || (claimedQrIds && claimedQrIds.length > 0)) {
                                navigation.navigate('Passcode' as never);
                                return;
                            }

                            // 3. NO QR SCANNED: Strictly forbid entry
                            Alert.alert(
                                "Setup Required",
                                "Dashboard is locked. Please scan and activate your Safety QR device first to enable security and access.",
                                [
                                    { text: "Open Scanner", onPress: () => navigation.navigate('QRScanner' as never) },
                                    { text: "Cancel", style: "cancel" }
                                ]
                            );
                        }}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="home-outline" size={24} color={colors.primary} style={{ marginRight: 12 }} />
                        <Text style={styles.dashboardBtnText}>My Dashboard</Text>
                    </TouchableOpacity>

                    <View style={styles.taglineBox}>
                        <Text style={styles.disclaimer}>
                            Powered by ThinkAIQ Secure Infrastructure
                        </Text>
                    </View>
                </View>
            </Animated.View>
        </SafeAreaView>
    );
}

function InfoRow({ icon, title, desc }: any) {
    return (
        <View style={styles.infoRow}>
            <View style={styles.infoIconBg}>
                <Ionicons name={icon} size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.infoTitle}>{title}</Text>
                <Text style={styles.infoDesc}>{desc}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    bgCircle: {
        position: 'absolute',
        top: -100,
        right: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: colors.primaryLight,
        opacity: 0.1,
    },
    content: {
        flex: 1,
        paddingHorizontal: spacing.xl,
        justifyContent: 'space-between',
        paddingVertical: spacing.xl,
    },
    heroSection: {
        alignItems: 'center',
        marginTop: spacing.md,
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.premium,
        marginBottom: spacing.lg,
    },
    brandTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: colors.secondary,
        letterSpacing: -1,
    },
    tagline: {
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: spacing.xs,
        fontWeight: '600',
    },
    infoSection: {
        gap: spacing.md,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        backgroundColor: 'rgba(255,255,255,0.7)',
        padding: spacing.md,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    infoIconBg: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.soft,
    },
    infoTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.secondary,
    },
    infoDesc: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 1,
    },
    footer: {
        marginBottom: spacing.md,
        width: '100%',
    },
    primaryBtn: {
        flexDirection: 'row',
        backgroundColor: colors.primary,
        height: 64,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.premium,
        width: '100%',
        elevation: 8, // Android shadow
    },
    primaryBtnText: {
        color: colors.white,
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    taglineBox: {
        marginTop: spacing.lg,
        paddingHorizontal: spacing.md,
    },
    disclaimer: {
        fontSize: 11,
        color: colors.textMuted,
        textAlign: 'center',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    secondaryBtn: {
        marginTop: spacing.md,
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    secondaryBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.primary,
        textDecorationLine: 'underline',
    },
    dashboardBtn: {
        flexDirection: 'row',
        backgroundColor: colors.white,
        height: 64,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: spacing.md,
        borderWidth: 2,
        borderColor: colors.primary,
        ...shadows.medium,
        width: '100%',
    },
    dashboardBtnText: {
        color: colors.primary,
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    deviceSetupBtn: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.5)',
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
        width: '100%',
    },
    deviceSetupText: {
        color: colors.textSecondary,
        fontSize: 14,
        fontWeight: '700',
    },
});
