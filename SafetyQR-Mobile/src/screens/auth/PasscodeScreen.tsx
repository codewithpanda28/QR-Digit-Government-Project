import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Vibration, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../services/supabase';
import { colors, spacing, shadows } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

export default function PasscodeScreen() {
    const navigation = useNavigation();
    const { passcode, setPasscode, unlock, user } = useAuthStore();
    const [code, setCode] = useState('');
    const [confirmCode, setConfirmCode] = useState('');
    const [isConfirming, setIsConfirming] = useState(false);
    const [error, setError] = useState(false);

    // Recovery State
    const [showForgot, setShowForgot] = useState(false);
    const [recName, setRecName] = useState('');
    const [recPhone, setRecPhone] = useState('');
    const [verifying, setVerifying] = useState(false);

    const shakeAnim = useRef(new Animated.Value(0)).current;

    const isSettingPasscode = !passcode;

    useEffect(() => {
        if (code.length === 4) {
            handleCodeComplete();
        }
    }, [code]);

    const verifyRecovery = async () => {
        if (!recName.trim() || !recPhone.trim()) {
            Alert.alert("Missing Details", "Please enter both Name and Phone.");
            return;
        }

        try {
            setVerifying(true);

            // Check Emergency Contacts for match
            const { data: contacts } = await supabase
                .from('emergency_contacts')
                .select('*')
                .eq('phone', recPhone.trim())
                .limit(1);

            // Check Details for Name
            const { data: details } = await supabase
                .from('qr_details')
                .select('id')
                .ilike('full_name', recName.trim())
                .limit(1);

            if ((details && details.length > 0) || (contacts && contacts.length > 0)) {
                await setPasscode('');
                Alert.alert("Identity Verified", "Your passcode has been reset. Please set a new one.");
                setShowForgot(false);
                setCode('');
                setConfirmCode('');
                setIsConfirming(false);
            } else {
                Alert.alert("Verification Failed", "No matching profile found with these details.");
            }
        } catch (e) {
            Alert.alert("Error", "Recovery failed.");
        } finally {
            setVerifying(false);
        }
    };

    const handleCodeComplete = async () => {
        if (isSettingPasscode) {
            if (!isConfirming) {
                setConfirmCode(code);
                setCode('');
                setIsConfirming(true);
            } else {
                if (code === confirmCode) {
                    await setPasscode(code);
                    Alert.alert("Passcode Set", "Dashboard access secured.", [
                        // @ts-ignore
                        { text: "Go to Dashboard", onPress: () => navigation.replace('MainTabs') }
                    ]);
                } else {
                    triggerError();
                    setConfirmCode(''); // Reset confirm
                    setIsConfirming(false); // Restart setting
                    setCode(''); // Clear input
                    Alert.alert("Mismatch", "Codes do not match. Try again.");
                }
            }
        } else {
            if (unlock(code)) {
                // @ts-ignore
                navigation.replace('MainTabs');
            } else {
                triggerError();
            }
        }
    };

    const triggerError = () => {
        setError(true);
        Vibration.vibrate(200);
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start(() => {
            setCode('');
            setError(false);
        });
    };

    const handlePress = (num: string) => {
        if (code.length < 4) {
            setCode(prev => prev + num);
        }
    };

    const handleDelete = () => {
        setCode(prev => prev.slice(0, -1));
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            <View style={styles.header}>
                <View style={styles.iconContainer}>
                    <Ionicons
                        name={isSettingPasscode ? "lock-open" : "lock-closed"}
                        size={40}
                        color={colors.primary}
                    />
                </View>
                <Text style={styles.title}>
                    {isSettingPasscode
                        ? (isConfirming ? "Confirm Passcode" : "Set App Passcode")
                        : "Enter Passcode"}
                </Text>
                <Text style={styles.subtitle}>
                    {isSettingPasscode
                        ? "Secure your safety data with a 4-digit code"
                        : `Welcome back, ${user?.full_name || 'Safety Member'}`}
                </Text>

                {!isSettingPasscode && (
                    <TouchableOpacity onPress={() => setShowForgot(true)} style={{ marginTop: 10 }}>
                        <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '800' }}>Forgot Passcode? Reset via Profile</Text>
                    </TouchableOpacity>
                )}
            </View>

            <Animated.View style={[styles.dotsContainer, { transform: [{ translateX: shakeAnim }] }]}>
                {[1, 2, 3, 4].map((_, i) => (
                    <View
                        key={i}
                        style={[
                            styles.dot,
                            code.length > i && styles.dotFilled,
                            error && styles.dotError
                        ]}
                    />
                ))}
            </Animated.View>

            <View style={styles.keypad}>
                <View style={styles.row}>
                    <Key num="1" onPress={handlePress} />
                    <Key num="2" onPress={handlePress} />
                    <Key num="3" onPress={handlePress} />
                </View>
                <View style={styles.row}>
                    <Key num="4" onPress={handlePress} />
                    <Key num="5" onPress={handlePress} />
                    <Key num="6" onPress={handlePress} />
                </View>
                <View style={styles.row}>
                    <Key num="7" onPress={handlePress} />
                    <Key num="8" onPress={handlePress} />
                    <Key num="9" onPress={handlePress} />
                </View>
                <View style={styles.row}>
                    <View style={styles.keyPlaceholder} />
                    <Key num="0" onPress={handlePress} />
                    <TouchableOpacity style={styles.key} onPress={handleDelete}>
                        <Ionicons name="backspace-outline" size={28} color={colors.secondary} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>Secure Instance: THINK-AUTH-V2</Text>
            </View>

            {/* Recovery Modal */}
            <Modal visible={showForgot} animationType="slide" transparent>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
                    <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 24, ...shadows.premium }}>
                        <Text style={{ fontSize: 20, fontWeight: '900', marginBottom: 8, color: colors.secondary }}>Reset Passcode</Text>
                        <Text style={{ color: colors.textSecondary, marginBottom: 24, fontSize: 14, lineHeight: 20 }}>
                            Enter details from one of your active Safety Profiles (e.g. Child Name) and the Emergency Contact Phone Number to verify identity.
                        </Text>

                        <TextInput
                            placeholder="Full Name (as in profile)"
                            placeholderTextColor={colors.textMuted}
                            style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 16, marginBottom: 12, fontSize: 16, backgroundColor: '#F8FAFC' }}
                            value={recName}
                            onChangeText={setRecName}
                        />
                        <TextInput
                            placeholder="Emergency Contact Phone"
                            placeholderTextColor={colors.textMuted}
                            style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 16, marginBottom: 24, fontSize: 16, backgroundColor: '#F8FAFC' }}
                            value={recPhone}
                            onChangeText={setRecPhone}
                            keyboardType="phone-pad"
                        />

                        <TouchableOpacity
                            style={{ backgroundColor: colors.primary, padding: 18, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', ...shadows.medium }}
                            onPress={verifyRecovery}
                            disabled={verifying}
                        >
                            {verifying && <ActivityIndicator color="white" style={{ marginRight: 8 }} />}
                            <Text style={{ color: 'white', fontWeight: '800', fontSize: 16 }}>VERIFY & RESET</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={{ marginTop: 20, alignItems: 'center', padding: 10 }} onPress={() => setShowForgot(false)}>
                            <Text style={{ color: colors.textMuted, fontWeight: '700' }}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

function Key({ num, onPress }: { num: string; onPress: (n: string) => void }) {
    return (
        <TouchableOpacity style={styles.key} onPress={() => onPress(num)}>
            <Text style={styles.keyText}>{num}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.xxl,
    },
    header: {
        alignItems: 'center',
        marginTop: spacing.xl,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
        ...shadows.soft,
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        color: colors.secondary,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: 8,
        maxWidth: width * 0.7,
        lineHeight: 20,
    },
    dotsContainer: {
        flexDirection: 'row',
        gap: spacing.xl,
        marginVertical: spacing.xxl,
    },
    dot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: colors.borderStrong,
    },
    dotFilled: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    dotError: {
        borderColor: colors.error,
        backgroundColor: colors.error,
    },
    keypad: {
        width: width * 0.8,
        gap: spacing.xl,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    key: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.soft,
    },
    keyPlaceholder: {
        width: 70,
    },
    keyText: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.secondary,
    },
    footer: {
        marginBottom: spacing.md,
    },
    footerText: {
        fontSize: 10,
        color: colors.textMuted,
        fontWeight: '800',
        letterSpacing: 1,
    }
});

