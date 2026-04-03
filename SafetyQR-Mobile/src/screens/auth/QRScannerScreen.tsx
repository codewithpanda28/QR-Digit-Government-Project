import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions, StatusBar, Linking } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, shadows } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';

const { width } = Dimensions.get('window');
const SCAN_AREA_SIZE = width * 0.7;

export default function QRScannerScreen() {
    const navigation = useNavigation();
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [flash, setFlash] = useState(false);
    const bypassAuth = useAuthStore(state => state.bypassAuth);

    if (!permission) {
        return <View style={styles.centerContainer}><Text style={styles.message}>Initializing lens...</Text></View>;
    }

    if (!permission.granted) {
        return (
            <View style={styles.centerContainer}>
                <Ionicons name="camera-outline" size={64} color={colors.textMuted} />
                <Text style={styles.message}>Camera access is required{'\n'}to scan device QR codes.</Text>
                <TouchableOpacity
                    style={styles.permissionBtn}
                    onPress={requestPermission}
                >
                    <Text style={styles.permissionBtnText}>Enable Camera</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const handleBarCodeScanned = ({ data }: { data: string }) => {
        setScanned(true);

        // Check if it's a Safety QR URL (from web dashboard)
        const isSafetyQR = data.includes('thinkaiq.com') ||
            data.includes('localhost:3000') ||
            data.includes('/scan/');

        if (isSafetyQR) {
            // Extract QR ID from URL
            // URL format: https://thinkaiq.com/scan/[uuid] or http://localhost:3000/scan/[uuid]
            const urlParts = data.split('/scan/');
            const qrId = urlParts.length > 1 ? urlParts[1].split('?')[0] : null;

            if (qrId) {
                // Navigate directly to SafetyQRViewer screen
                // We pass scannedInApp: true so viewer knows to show native form instead of browser link
                Alert.alert(
                    "Safety QR Detected",
                    "Do you want to setup or view this Safety QR?",
                    [
                        {
                            text: "Cancel",
                            onPress: () => setScanned(false),
                            style: "cancel"
                        },
                        {
                            text: "View / Setup Profile",
                            onPress: () => {
                                // @ts-ignore
                                navigation.navigate('SafetyQRViewer', {
                                    qrId,
                                    qrUrl: data,
                                    scannedInApp: true
                                });
                            }
                        }
                    ]
                );
            } else {
                // Invalid URL format, open in browser as fallback
                Alert.alert(
                    "Safety QR Detected",
                    "Opening in browser...",
                    [
                        {
                            text: "OK",
                            onPress: async () => {
                                try {
                                    await Linking.openURL(data);
                                    navigation.goBack();
                                } catch (error) {
                                    Alert.alert("Error", "Failed to open QR code");
                                    setScanned(false);
                                }
                            }
                        }
                    ]
                );
            }
        } else {
            // It's a device QR code (keep original functionality)
            Alert.alert(
                "Device Identified",
                `SafetyQR ID: ${data}\nDevice Status: READY`,
                [
                    {
                        text: "Go to Dashboard",
                        onPress: () => {
                            bypassAuth();
                        }
                    },
                    {
                        text: "Scan Again",
                        onPress: () => setScanned(false)
                    }
                ]
            );
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <CameraView
                style={styles.camera}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                enableTorch={flash}
            >
                <View style={styles.overlay}>
                    {/* Header Controls */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.controlBtn}
                            onPress={() => navigation.goBack()}
                        >
                            <Ionicons name="close" size={24} color={colors.white} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.controlBtn}
                            onPress={() => setFlash(!flash)}
                        >
                            <Ionicons name={flash ? "flash" : "flash-off"} size={22} color={colors.white} />
                        </TouchableOpacity>
                    </View>

                    {/* Scan Guides */}
                    <View style={styles.scanContainer}>
                        <View style={styles.scanTarget}>
                            <View style={[styles.corner, styles.topRight]} />
                            <View style={[styles.corner, styles.topLeft]} />
                            <View style={[styles.corner, styles.bottomRight]} />
                            <View style={[styles.corner, styles.bottomLeft]} />

                            {/* Scanning indicator */}
                            <View style={styles.scanLine} />
                        </View>
                        <Text style={styles.guideText}>Scan the QR on your Safety Device</Text>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>ThinkAIQ Safety Network • v1.0</Text>
                    </View>
                </View>
            </CameraView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.black,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
        padding: spacing.xl,
    },
    camera: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'space-between',
        paddingVertical: spacing.xxl,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.xl,
    },
    controlBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    scanTarget: {
        width: SCAN_AREA_SIZE,
        height: SCAN_AREA_SIZE,
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanLine: {
        width: '90%',
        height: 2,
        backgroundColor: colors.primary,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        opacity: 0.6,
    },
    corner: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderColor: colors.primary,
        borderWidth: 4,
    },
    topRight: {
        top: 0,
        right: 0,
        borderLeftWidth: 0,
        borderBottomWidth: 0,
        borderTopRightRadius: 20,
    },
    topLeft: {
        top: 0,
        left: 0,
        borderRightWidth: 0,
        borderBottomWidth: 0,
        borderTopLeftRadius: 20,
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        borderBottomRightRadius: 20,
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderRightWidth: 0,
        borderTopWidth: 0,
        borderBottomLeftRadius: 20,
    },
    guideText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '700',
        marginTop: spacing.xl,
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    footer: {
        alignItems: 'center',
    },
    footerText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        fontWeight: '600',
    },
    message: {
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: spacing.md,
        lineHeight: 24,
    },
    permissionBtn: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: 16,
        marginTop: spacing.xl,
        ...shadows.medium,
    },
    permissionBtnText: {
        color: colors.white,
        fontWeight: '800',
        fontSize: 16,
    },
});
