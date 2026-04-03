import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch, Modal, TextInput, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, shadows } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import * as Device from 'expo-device';
import * as Network from 'expo-network';

export default function ProfileScreen() {
    const navigation = useNavigation();
    const { user, session, logout, familyProfiles, switchProfile, updateProfile, lock, claimedQrIds, passcode } = useAuthStore();
    const [showSwitchModal, setShowSwitchModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showPasscodeModal, setShowPasscodeModal] = useState(false);
    const [pendingProfileId, setPendingProfileId] = useState<string | null>(null);
    const [switchPasscode, setSwitchPasscode] = useState('');
    const [newFamilyName, setNewFamilyName] = useState('');

    // Editable states
    const [name, setName] = useState(user?.full_name || '');
    const [phone, setPhone] = useState(user?.phone_number || '+91');
    const [email, setEmail] = useState(user?.email || '');
    const [deviceInfo, setDeviceInfo] = useState({ model: '', os: '', ip: '' });
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [activeQrId, setActiveQrId] = useState('Safety-ID-V1');

    // Sync with user data changes
    useEffect(() => {
        if (user) {
            setName(user.full_name || '');
            setPhone(user.phone_number || '+91');
            setEmail(user.email || '');
        }
        loadDeviceAndQrData();
    }, [user]);

    async function loadDeviceAndQrData() {
        try {
            // Get Device Info
            const model = Device.modelName || 'Unknown Device';
            const os = `${Device.osName} ${Device.osVersion}`;
            const ip = await Network.getIpAddressAsync();
            setDeviceInfo({ model, os, ip });

            if (claimedQrIds && claimedQrIds.length > 0) {
                // Try to find a profile name from any of the claimed QRs if not set
                for (const qid of claimedQrIds) {
                    const { data: qrData } = await supabase
                        .from('qr_codes')
                        .select('qr_number, qr_details(*)')
                        .eq('id', qid)
                        .maybeSingle();

                    if (qrData) {
                        setActiveQrId(qrData.qr_number || qid.substring(0, 8).toUpperCase());
                        const details = Array.isArray(qrData.qr_details) ? qrData.qr_details[0] : qrData.qr_details;

                        const pName = details?.full_name || details?.student_name || details?.additional_data?.profile_name;
                        const pImage = details?.additional_data?.profile_image;

                        // Only override if current name is empty or guest
                        if (pName && (!name || name === 'Guest User')) setName(pName);
                        if (pImage && !profileImage) setProfileImage(pImage);

                        if (pName) break; // Found one
                    }
                }
            }
        } catch (error) {
            console.error('Error loading device/qr data:', error);
        }
    }

    const handleAddProfile = () => {
        setShowAddModal(true);
    };

    const submitAddProfile = () => {
        if (newFamilyName.trim()) {
            const newProfile = {
                id: 'family-' + Date.now(),
                full_name: newFamilyName.trim(),
                email: newFamilyName.trim().toLowerCase().replace(/\s/g, '') + '@family.safetyqr',
            };
            useAuthStore.getState().addFamilyProfile(newProfile);
            setNewFamilyName('');
            setShowAddModal(false);
            Alert.alert("Profile Added", `${newFamilyName} has been added to your family circle.`);
        } else {
            Alert.alert("Missing Name", "Please enter a name for the family member.");
        }
    };

    const handleSwitchAttempt = (profileId: string) => {
        if (passcode) {
            setPendingProfileId(profileId);
            setSwitchPasscode('');
            setShowPasscodeModal(true);
        } else {
            switchProfile(profileId);
            setShowSwitchModal(false);
        }
    };

    const verifyAndSwitch = () => {
        if (switchPasscode === passcode) {
            if (pendingProfileId) {
                switchProfile(pendingProfileId);
                setShowSwitchModal(false);
                setShowPasscodeModal(false);
                setPendingProfileId(null);
            }
        } else {
            Alert.alert("Error", "Invalid Passcode");
            setSwitchPasscode('');
        }
    };

    const handleLogout = async () => {
        Alert.alert("Sign Out", "Are you sure you want to sign out from this device?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Sign Out",
                style: "destructive",
                onPress: async () => {
                    try {
                        await logout();
                        await AsyncStorage.clear();
                        // @ts-ignore
                        navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
                    } catch (error) {
                        console.error('Logout error:', error);
                    }
                }
            }
        ]);
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            if (user?.id && !user.id.startsWith('guest-')) {
                const { error } = await supabase
                    .from('app_users')
                    .update({
                        full_name: name,
                        phone_number: phone,
                        email: email,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', user.id);

                if (error) throw error;
            }

            const res = await updateProfile({ full_name: name, phone_number: phone, email: email });

            if (res.success) {
                setIsEditing(false);
                Alert.alert("Success", "Profile updated successfully!");
            } else {
                Alert.alert("Error", res.error || "Update failed");
            }
        } catch (error: any) {
            console.error('Save error:', error);
            Alert.alert("Error", error.message || "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const handleLock = () => {
        Alert.alert("Lock App", "Are you sure you want to lock the app? You will need your passcode to enter again.", [
            { text: "Cancel", style: "cancel" },
            { text: "Lock Now", onPress: () => lock() }
        ]);
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>My Protection Account</Text>
                        <TouchableOpacity style={styles.switchHeaderBtn} onPress={() => setShowSwitchModal(true)}>
                            <Ionicons name="people" size={20} color={colors.primary} />
                            <Text style={styles.switchBtnText}>Switch</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Profile Card */}
                    <View style={styles.profileCard}>
                        <View style={[styles.avatarLarge, !profileImage && { backgroundColor: colors.primary }]}>
                            {profileImage ? (
                                <Image source={{ uri: profileImage }} style={styles.avatarLargeImage} />
                            ) : (
                                <Text style={styles.avatarLargeText}>{(name || user?.full_name || 'U').charAt(0).toUpperCase()}</Text>
                            )}
                        </View>

                        {isEditing ? (
                            <View style={styles.editForm}>
                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputLabel}>Full Name</Text>
                                    <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Enter full name" />
                                </View>
                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputLabel}>Phone Number</Text>
                                    <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="Enter phone" />
                                </View>
                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputLabel}>Email Address</Text>
                                    <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="Enter email" />
                                </View>
                                <View style={styles.editActions}>
                                    <TouchableOpacity style={[styles.actionBtn, styles.cancelBtn]} onPress={() => setIsEditing(false)}>
                                        <Text style={styles.cancelBtnText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.actionBtn, styles.saveBtn]} onPress={handleSave}>
                                        <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <>
                                <Text style={styles.userName}>{name || user?.full_name || 'Safety User'}</Text>
                                <Text style={styles.userEmail}>{email || user?.email || 'protection@safetyqr.ai'}</Text>
                                <TouchableOpacity style={styles.editTrigger} onPress={() => setIsEditing(true)}>
                                    <Ionicons name="create-outline" size={16} color={colors.primary} />
                                    <Text style={styles.editTriggerText}>Update Account Details</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>

                    {/* Security Actions */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Privacy & Security</Text>
                        <View style={styles.settingsGroup}>
                            <TouchableOpacity style={styles.settingRow} onPress={() => navigation.navigate('Passcode' as never)}>
                                <View style={[styles.settingIconContainer, { backgroundColor: '#F1F5F9' }]}>
                                    <Ionicons name="finger-print" size={20} color={colors.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.settingLabel}>Passcode & Biometrics</Text>
                                    <Text style={{ fontSize: 12, color: colors.textMuted }}>{passcode ? 'Security Active' : 'Setup Passcode'}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={16} color={colors.borderStrong} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.settingRow} onPress={handleLock}>
                                <View style={[styles.settingIconContainer, { backgroundColor: '#FEF2F2' }]}>
                                    <Ionicons name="lock-closed" size={20} color={colors.error} />
                                </View>
                                <Text style={styles.settingLabel}>Lock App Session</Text>
                                <Ionicons name="chevron-forward" size={16} color={colors.borderStrong} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Account Details */}
                    {!isEditing && (
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>Hardware & Protection</Text>
                            <View style={styles.detailsGroup}>
                                <DetailItem icon="qr-code" label="Active Safety ID" value={activeQrId} />
                                <DetailItem icon="phone-portrait" label="Linked Device" value={deviceInfo.model} />
                                <DetailItem icon="cog" label="System Software" value={deviceInfo.os} />
                                <DetailItem icon="globe" label="Network IP" value={deviceInfo.ip || 'Local Mesh'} />
                            </View>
                        </View>
                    )}

                    {/* Logout Button */}
                    <View style={styles.section}>
                        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                            <Ionicons name="log-out" size={20} color={colors.error} />
                            <Text style={styles.logoutBtnText}>Sign Out from This Device</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Profile Switch Modal */}
            <Modal visible={showSwitchModal} transparent={true} animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>Switch Profile</Text>
                                <Text style={styles.modalSubtitle}>Manage your family circle</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowSwitchModal(false)}>
                                <Ionicons name="close-circle" size={32} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
                            {/* Primary User */}
                            <TouchableOpacity
                                style={[styles.profileItem, user?.id === session?.user?.id && styles.activeProfileItem]}
                                onPress={() => handleSwitchAttempt(session?.user?.id)}
                            >
                                <View style={[styles.profileAvatar, { backgroundColor: user?.id === session?.user?.id ? colors.primary : '#E2E8F0' }]}>
                                    <Text style={[styles.profileAvatarText, { color: user?.id === session?.user?.id ? colors.white : colors.textSecondary }]}>
                                        {user?.id === session?.user?.id ? (user?.full_name?.charAt(0) || 'P') : 'P'}
                                    </Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.profileName}>Primary Account</Text>
                                    <Text style={styles.profileEmail}>{session?.user?.email}</Text>
                                </View>
                                {user?.id === session?.user?.id && <Ionicons name="checkmark-circle" size={24} color={colors.primary} />}
                            </TouchableOpacity>

                            {familyProfiles.filter(p => p.id !== session?.user?.id).map((profile) => (
                                <TouchableOpacity
                                    key={profile.id}
                                    style={[styles.profileItem, user?.id === profile.id && styles.activeProfileItem]}
                                    onPress={() => handleSwitchAttempt(profile.id)}
                                >
                                    <View style={[styles.profileAvatar, { backgroundColor: user?.id === profile.id ? colors.primary : '#E2E8F0' }]}>
                                        <Text style={[styles.profileAvatarText, { color: user?.id === profile.id ? colors.white : colors.textSecondary }]}>
                                            {profile.full_name?.charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.profileName}>{profile.full_name}</Text>
                                        <Text style={styles.profileEmail}>{profile.email}</Text>
                                    </View>
                                    {user?.id === profile.id && <Ionicons name="checkmark-circle" size={24} color={colors.primary} />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Add Family Member Modal */}
            <Modal visible={showAddModal} transparent={true} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { paddingBottom: spacing.xxl }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add Family Member</Text>
                            <TouchableOpacity onPress={() => setShowAddModal(false)}>
                                <Ionicons name="close-circle" size={32} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>

                        <Text style={{ color: colors.textSecondary, marginBottom: 20 }}>
                            Enter the full name to link a new safety profile.
                        </Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Full Name"
                            value={newFamilyName}
                            onChangeText={setNewFamilyName}
                            autoFocus={true}
                        />

                        <TouchableOpacity
                            style={[styles.actionBtn, styles.saveBtn, { marginTop: 24, width: '100%' }]}
                            onPress={submitAddProfile}
                        >
                            <Text style={styles.saveBtnText}>Link Profile</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Passcode Verification Modal */}
            <Modal
                visible={showPasscodeModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowPasscodeModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.modalContent}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Security Check</Text>
                            <TouchableOpacity onPress={() => setShowPasscodeModal(false)}>
                                <Ionicons name="close" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalDesc}>Enter your 4-digit passcode to switch to this profile.</Text>

                        <TextInput
                            style={[styles.input, { letterSpacing: 10, textAlign: 'center', fontSize: 24, fontWeight: 'bold' }]}
                            placeholder="XXXX"
                            placeholderTextColor={colors.textMuted}
                            keyboardType="number-pad"
                            maxLength={4}
                            secureTextEntry={true}
                            value={switchPasscode}
                            onChangeText={setSwitchPasscode}
                            autoFocus={true}
                        />

                        <TouchableOpacity
                            style={[styles.saveBtn, { marginTop: spacing.xl, backgroundColor: switchPasscode.length === 4 ? colors.primary : colors.textMuted }]}
                            onPress={verifyAndSwitch}
                            disabled={switchPasscode.length !== 4}
                        >
                            <Text style={styles.saveBtnText}>Verify & Switch</Text>
                        </TouchableOpacity>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

function DetailItem({ icon, label, value }: any) {
    return (
        <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
                <Ionicons name={icon} size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.detailLabel}>{label}</Text>
                <Text style={styles.detailValue}>{value}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    scrollView: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
    headerTitle: { fontSize: 20, fontWeight: '800', color: colors.secondary },
    switchHeaderBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 6, ...shadows.soft },
    switchBtnText: { fontSize: 13, fontWeight: '700', color: colors.primary },
    profileCard: { alignItems: 'center', backgroundColor: colors.white, margin: spacing.lg, padding: spacing.xl, borderRadius: 32, ...shadows.medium },
    avatarLarge: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md, overflow: 'hidden', borderWidth: 3, borderColor: '#fff' },
    avatarLargeImage: { width: '100%', height: '100%' },
    avatarLargeText: { fontSize: 42, fontWeight: '900', color: colors.white },
    userName: { fontSize: 24, fontWeight: '800', color: colors.secondary, marginBottom: 4 },
    userEmail: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.lg },
    editForm: { width: '100%', gap: spacing.md },
    inputContainer: { gap: 4 },
    inputLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, marginLeft: 4 },
    input: { backgroundColor: '#F1F5F9', padding: spacing.md, borderRadius: 12, fontSize: 15, fontWeight: '600', color: colors.secondary },
    editActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
    actionBtn: { flex: 1, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    cancelBtn: { backgroundColor: '#F1F5F9' },
    saveBtn: { backgroundColor: colors.primary },
    cancelBtnText: { fontWeight: '700', color: colors.textSecondary },
    saveBtnText: { fontWeight: '700', color: colors.white },
    editTrigger: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EEF2FF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25 },
    editTriggerText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
    section: { paddingHorizontal: spacing.lg, marginBottom: spacing.xl },
    sectionLabel: { fontSize: 11, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.md, marginLeft: 4 },
    settingsGroup: { backgroundColor: colors.white, borderRadius: 24, overflow: 'hidden', ...shadows.soft },
    settingRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    settingIconContainer: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
    settingLabel: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.secondary },
    detailsGroup: { backgroundColor: colors.white, borderRadius: 24, overflow: 'hidden', ...shadows.soft },
    detailRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    detailIconContainer: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
    detailLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase' },
    detailValue: { fontSize: 15, color: colors.secondary, fontWeight: '700', marginTop: 1 },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF2F2', padding: spacing.lg, borderRadius: 20, gap: spacing.sm, borderWidth: 1, borderColor: '#FEE2E2' },
    logoutBtnText: { color: colors.error, fontSize: 15, fontWeight: '700' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingTop: spacing.xl, paddingHorizontal: spacing.xl, paddingBottom: 40, maxHeight: '85%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
    modalTitle: { fontSize: 22, fontWeight: '900', color: colors.secondary },
    modalSubtitle: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
    modalDesc: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl, lineHeight: 20 },
    modalList: { flexGrow: 0 },
    profileItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: 24, marginBottom: spacing.sm, borderWidth: 2, borderColor: 'transparent', backgroundColor: '#F8FAFC' },
    activeProfileItem: { backgroundColor: '#EEF2FF', borderColor: colors.primary },
    profileAvatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
    profileAvatarText: { fontSize: 20, fontWeight: 'bold' },
    profileName: { fontSize: 16, fontWeight: '800', color: colors.secondary },
    profileEmail: { fontSize: 12, color: colors.textMuted },
    addProfileBtn: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, borderRadius: 24, marginTop: spacing.md, backgroundColor: '#F0F9FF', borderWidth: 1, borderStyle: 'dashed', borderColor: colors.primary },
    addIconBg: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md, ...shadows.soft },
    addProfileText: { fontSize: 15, fontWeight: '800', color: colors.primary },
});
