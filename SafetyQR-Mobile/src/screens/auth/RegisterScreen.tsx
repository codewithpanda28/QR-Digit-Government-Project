import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, shadows } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
    const navigation = useNavigation();
    const { register } = useAuthStore();
    const [formData, setFormData] = useState({
        full_name: '',
        phone_number: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleRegister = async () => {
        if (!formData.full_name || !formData.phone_number || !formData.email || !formData.password) {
            Alert.alert('Required Fields', 'Please fill in all mandatory fields (*) to create your account.');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            Alert.alert('Password Mismatch', 'The passwords you entered do not match. Please try again.');
            return;
        }

        setLoading(true);
        const result = await register({
            full_name: formData.full_name,
            phone_number: formData.phone_number,
            email: formData.email,
            password: formData.password,
        });
        setLoading(false);

        if (!result.success) {
            Alert.alert('Registration Error', result.error || 'Something went wrong during registration.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    <View style={styles.content}>
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                            <Ionicons name="arrow-back" size={24} color={colors.secondary} />
                        </TouchableOpacity>

                        <View style={styles.header}>
                            <Text style={styles.title}>Create Account</Text>
                            <Text style={styles.subtitle}>Secure your world in just a few steps.</Text>
                        </View>

                        <View style={styles.form}>
                            <InputGroup
                                label="Full Name *"
                                icon="person-outline"
                                placeholder="Akash Kumar"
                                value={formData.full_name}
                                onChangeText={(text: string) => setFormData({ ...formData, full_name: text })}
                            />

                            <InputGroup
                                label="Phone Number *"
                                icon="call-outline"
                                placeholder="+91 98765 43210"
                                keyboardType="phone-pad"
                                value={formData.phone_number}
                                onChangeText={(text: string) => setFormData({ ...formData, phone_number: text })}
                            />

                            <InputGroup
                                label="Email *"
                                icon="mail-outline"
                                placeholder="john@example.com"
                                keyboardType="email-address"
                                value={formData.email}
                                onChangeText={(text: string) => setFormData({ ...formData, email: text })}
                            />

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Password *</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="••••••••"
                                        placeholderTextColor={colors.textMuted}
                                        value={formData.password}
                                        onChangeText={(text: string) => setFormData({ ...formData, password: text })}
                                        secureTextEntry={!showPassword}
                                        autoCapitalize="none"
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                        <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textMuted} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <InputGroup
                                label="Confirm Password *"
                                icon="shield-checkmark-outline"
                                placeholder="••••••••"
                                secureTextEntry={!showPassword}
                                value={formData.confirmPassword}
                                onChangeText={(text: string) => setFormData({ ...formData, confirmPassword: text })}
                            />

                            <TouchableOpacity
                                style={[styles.registerBtn, loading && styles.btnDisabled]}
                                onPress={handleRegister}
                                disabled={loading}
                                activeOpacity={0.8}
                            >
                                {loading ? (
                                    <Text style={styles.registerBtnText}>Creating Account...</Text>
                                ) : (
                                    <>
                                        <Text style={styles.registerBtnText}>Join SafetyQR</Text>
                                        <Ionicons name="chevron-forward" size={20} color={colors.white} style={{ marginLeft: 8 }} />
                                    </>
                                )}
                            </TouchableOpacity>

                            <View style={styles.footer}>
                                <Text style={styles.footerText}>Already have an account? </Text>
                                <TouchableOpacity onPress={() => navigation.navigate('Login' as never)}>
                                    <Text style={styles.loginText}>Sign In</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

function InputGroup({ label, icon, ...props }: any) {
    return (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.inputContainer}>
                <Ionicons name={icon} size={20} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                    {...props}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: spacing.xl,
        paddingBottom: spacing.xxl,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.soft,
        marginBottom: spacing.xl,
    },
    header: {
        marginBottom: spacing.xxl,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: colors.secondary,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        color: colors.textSecondary,
        marginTop: spacing.sm,
        lineHeight: 22,
    },
    form: {
        gap: spacing.lg,
    },
    inputGroup: {
        gap: spacing.sm,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.secondary,
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: 16,
        paddingHorizontal: spacing.md,
        height: 56,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.soft,
    },
    inputIcon: {
        marginRight: spacing.sm,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: colors.text,
        fontWeight: '500',
    },
    registerBtn: {
        flexDirection: 'row',
        backgroundColor: colors.primary,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.premium,
        marginTop: spacing.md,
    },
    btnDisabled: {
        opacity: 0.7,
    },
    registerBtnText: {
        color: colors.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: spacing.md,
    },
    footerText: {
        fontSize: 15,
        color: colors.textSecondary,
    },
    loginText: {
        fontSize: 15,
        color: colors.primary,
        fontWeight: 'bold',
    },
});
