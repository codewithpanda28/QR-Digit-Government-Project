import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, FlatList, Modal, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing } from '../constants/theme';
import { supabase } from '../services/supabase';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../store/authStore';

const SAFETY_TEMPLATES = [
    {
        id: 'child',
        label: 'Child Safety',
        icon: 'happy-outline',
        color: '#FF6B6B',
        desc: 'For students & toddlers',
        fields: {
            name: 'Child Name',
            age: 'Age',
            address: 'Home Address',
            c1: 'Primary Parent',
            c1Rel: 'Father',
            c2: 'Secondary Parent',
            c2Rel: 'Mother'
        }
    },
    {
        id: 'women',
        label: 'Women Safety',
        icon: 'woman-outline',
        color: '#FF9F43',
        desc: 'Personal protection',
        fields: {
            name: 'Full Name',
            age: 'Age',
            address: 'Work/Home Address',
            c1: 'Emergency Contact 1',
            c1Rel: 'Husband/Father',
            c2: 'Emergency Contact 2',
            c2Rel: 'Friend'
        }
    },
    {
        id: 'senior',
        label: 'Senior Citizen',
        icon: 'body-outline',
        color: '#54A0FF',
        desc: 'Elderly care & medical',
        fields: {
            name: 'Senior Name',
            age: 'Age',
            address: 'Home Address',
            c1: 'Primary Caretaker',
            c1Rel: 'Son/Daughter',
            c2: 'Doctor/Neighbor',
            c2Rel: 'Doctor'
        }
    },
    {
        id: 'vehicle',
        label: 'Vehicle Safety',
        icon: 'car-sport-outline',
        color: '#1DD1A1',
        desc: 'Accident & owner info',
        fields: {
            name: 'Owner Name',
            age: 'Vehicle Number',
            address: 'Owner Address',
            c1: 'Driver/Owner',
            c1Rel: 'Self',
            c2: 'Family Member',
            c2Rel: 'Spouse'
        }
    },
    {
        id: 'pet',
        label: 'Pet Safety',
        icon: 'paw-outline',
        color: '#A29BFE',
        desc: 'Lost & found for pets',
        fields: {
            name: 'Pet Name',
            age: 'Age/Breed',
            address: 'Owner Address',
            c1: 'Primary Owner',
            c1Rel: 'Owner',
            c2: 'Vet/Secondary',
            c2Rel: 'Vet'
        }
    },
    {
        id: 'medical',
        label: 'Medical / Patient',
        icon: 'medkit-outline',
        color: '#ff7675',
        desc: 'Critical medical info',
        fields: {
            name: 'Patient Name',
            age: 'Age / Blood Group',
            address: 'Home Address',
            c1: 'Emergency Contact',
            c1Rel: 'Relation',
            c2: 'Doctor / Hospital',
            c2Rel: 'Doctor'
        }
    },
    {
        id: 'luggage',
        label: 'Luggage / Bag',
        icon: 'briefcase-outline',
        color: '#fdcb6e',
        desc: 'Lost & Found for bags',
        fields: {
            name: 'Owner Name',
            age: 'Flight / Train No',
            address: 'Destination/Home',
            c1: 'Primary Contact',
            c1Rel: 'Relation',
            c2: 'Alternative Contact',
            c2Rel: 'Relation'
        }
    },
    {
        id: 'keys',
        label: 'Keys / Keychain',
        icon: 'key-outline',
        color: '#636e72',
        desc: 'Return lost keys',
        fields: {
            name: 'Owner Name',
            age: 'Key ID (Optional)',
            address: 'Drop Location',
            c1: 'Owner Contact',
            c1Rel: 'Self',
            c2: 'Alternative',
            c2Rel: 'Friend'
        }
    },
    {
        id: 'gadget',
        label: 'Laptop / Gadget',
        icon: 'laptop-outline',
        color: '#0984e3',
        desc: 'Secure device recovery',
        fields: {
            name: 'Owner Name',
            age: 'Model / Serial',
            address: 'Office / Home',
            c1: 'Owner Contact',
            c1Rel: 'Self',
            c2: 'IT Admin / Alt',
            c2Rel: 'Admin'
        }
    },
    {
        id: 'bicycle',
        label: 'Bicycle Safety',
        icon: 'bicycle-outline',
        color: '#00b894',
        desc: 'Theft protection',
        fields: {
            name: 'Owner Name',
            age: 'Cycle Model/Color',
            address: 'Address',
            c1: 'Owner Contact',
            c1Rel: 'Self',
            c2: 'Parent / Alt',
            c2Rel: 'Relation'
        }
    },
    {
        id: 'autism',
        label: 'Autism / Special',
        icon: 'people-outline',
        color: '#a29bfe',
        desc: 'Special needs support',
        fields: {
            name: 'Name',
            age: 'Age / Condition',
            address: 'Home Address',
            c1: 'Guardian 1',
            c1Rel: 'Relation',
            c2: 'Guardian 2',
            c2Rel: 'Relation'
        }
    },
    {
        id: 'employee',
        label: 'Employee ID',
        icon: 'id-card-outline',
        color: '#2d3436',
        desc: 'Workplace identity',
        fields: {
            name: 'Employee Name',
            age: 'Emp ID / Dept',
            address: 'Office Address',
            c1: 'Manager / HR',
            c1Rel: 'Supervisor',
            c2: 'Emergency Contact',
            c2Rel: 'Family'
        }
    },
    {
        id: 'event',
        label: 'Event / Crowd',
        icon: 'ticket-outline',
        color: '#e17055',
        desc: 'Crowd management',
        fields: {
            name: 'Visitor Name',
            age: 'Ticket / Group ID',
            address: 'Meeting Point',
            c1: 'Group Leader',
            c1Rel: 'Leader',
            c2: 'Event Security',
            c2Rel: 'Security'
        }
    },
    {
        id: 'disaster',
        label: 'Disaster Relief',
        icon: 'bandage-outline',
        color: '#d63031',
        desc: 'Emergency ID Band',
        fields: {
            name: 'Name',
            age: 'Age / Gender',
            address: 'Camp / Origin',
            c1: 'Camp Officer',
            c1Rel: 'Official',
            c2: 'Family Member',
            c2Rel: 'Relation'
        }
    },
    {
        id: 'home',
        label: 'Home Security',
        icon: 'home-outline',
        color: '#00cec9',
        desc: 'Door / Gate ID',
        fields: {
            name: 'Owner Name',
            age: 'Flat / House No',
            address: 'Full Address',
            c1: 'Primary Resident',
            c1Rel: 'Self',
            c2: 'Security / Guard',
            c2Rel: 'Guard'
        }
    },
    {
        id: 'custom',
        label: 'Custom / Other',
        icon: 'options-outline',
        color: '#6c5ce7',
        desc: 'Fully customizable profile',
        fields: {
            name: 'Full Name / Title',
            age: 'Age / ID Number',
            address: 'Address / Location',
            c1: 'Primary Contact',
            c1Rel: 'Relation',
            c2: 'Secondary Contact',
            c2Rel: 'Relation'
        }
    }
];

const FIELD_GROUPS = {
    common: [
        { label: 'Blood Group', icon: 'water-outline' },
        { label: 'Medical Condition', icon: 'medkit-outline' },
        { label: 'Allergies', icon: 'warning-outline' },
        { label: 'Doctor Contact', icon: 'call-outline' },
        { label: 'Address / Location', icon: 'location-outline' },
        { label: 'Custom Field', icon: 'create-outline', isCustom: true },
    ],
    child: [
        { label: 'School Name', icon: 'school-outline' },
        { label: 'Class / Section', icon: 'book-outline' },
        { label: 'Roll Number', icon: 'list-outline' },
        { label: 'Bus Number', icon: 'bus-outline' },
        { label: 'Teacher Name', icon: 'person-outline' },
    ],
    vehicle: [
        { label: 'Insurance Provider', icon: 'business-outline' },
        { label: 'Policy Number', icon: 'document-text-outline' },
        { label: 'Chassis Number', icon: 'barcode-outline' },
        { label: 'Mechanic Contact', icon: 'construct-outline' },
        { label: 'Driving License', icon: 'id-card-outline' },
    ],
    women: [
        { label: 'Work Address', icon: 'briefcase-outline' },
        { label: 'Helpline Number', icon: 'shield-outline' },
        { label: 'Trusted Neighbor', icon: 'people-outline' },
    ],
    senior: [
        { label: 'Regular Medicine', icon: 'medkit-outline' },
        { label: 'Hospital Name', icon: 'business-outline' },
        { label: 'Insurance Details', icon: 'card-outline' },
        { label: 'Caretaker Contact', icon: 'person-outline' },
    ],
    pet: [
        { label: 'Breed', icon: 'paw-outline' },
        { label: 'Vet Name', icon: 'person-outline' },
        { label: 'Chip ID', icon: 'qr-code-outline' },
        { label: 'Food Allergies', icon: 'warning-outline' },
    ],
    medical: [
        { label: 'Blood Group', icon: 'water-outline' },
        { label: 'Key Medical Info', icon: 'medkit-outline' },
        { label: 'Current Medications', icon: 'bandage-outline' },
        { label: 'Hospital File No', icon: 'document-text-outline' },
        { label: 'Health Insurance ID', icon: 'card-outline' },
        { label: 'Donor Status', icon: 'heart-outline' },
    ],
    luggage: [
        { label: 'Flight Number', icon: 'airplane-outline' },
        { label: 'Train Number', icon: 'train-outline' },
        { label: 'Destination Hotel', icon: 'business-outline' },
        { label: 'Passport Details', icon: 'card-outline' },
        { label: 'Contents Value', icon: 'cash-outline' },
    ],
    keys: [
        { label: 'Reward if Found', icon: 'gift-outline' },
        { label: 'Drop Off Point', icon: 'location-outline' },
        { label: 'Car Model', icon: 'car-outline' },
        { label: 'Key Type', icon: 'key-outline' },
    ],
    gadget: [
        { label: 'Serial Number', icon: 'barcode-outline' },
        { label: 'Model Name', icon: 'laptop-outline' },
        { label: 'Password Hint', icon: 'key-outline' },
        { label: 'Asset Tag', icon: 'pricetag-outline' },
        { label: 'Organization IT', icon: 'business-outline' },
    ],
    bicycle: [
        { label: 'Frame Number', icon: 'barcode-outline' },
        { label: 'Model/Color', icon: 'color-palette-outline' },
        { label: 'Purchase Date', icon: 'calendar-outline' },
        { label: 'Lock Code', icon: 'lock-closed-outline' },
    ],
    autism: [
        { label: 'Calming Method', icon: 'musical-notes-outline' },
        { label: 'Sensory Triggers', icon: 'ear-outline' },
        { label: 'Communication Mode', icon: 'chatbubble-outline' },
        { label: 'Therapist Contact', icon: 'call-outline' },
        { label: 'Favorite Item', icon: 'star-outline' },
    ],
    employee: [
        { label: 'Employee ID', icon: 'id-card-outline' },
        { label: 'Department', icon: 'people-outline' },
        { label: 'Designation', icon: 'ribbon-outline' },
        { label: 'Work Location', icon: 'business-outline' },
        { label: 'Shift Timing', icon: 'time-outline' },
    ],
    event: [
        { label: 'Ticket ID', icon: 'ticket-outline' },
        { label: 'Group Name', icon: 'people-outline' },
        { label: 'Access Level', icon: 'lock-open-outline' },
        { label: 'Entry Gate', icon: 'enter-outline' },
    ],
    disaster: [
        { label: 'Camp ID', icon: 'home-outline' },
        { label: 'Relief Status', icon: 'checkbox-outline' },
        { label: 'Origin Village', icon: 'location-outline' },
        { label: 'Family Head', icon: 'person-outline' },
        { label: 'Ration Card', icon: 'card-outline' },
    ],
    home: [
        { label: 'Owner Contact', icon: 'call-outline' },
        { label: 'Flat Number', icon: 'home-outline' },
        { label: 'Security Intercom', icon: 'call-outline' },
        { label: 'Emergency Exit', icon: 'exit-outline' },
    ],
    custom: [
        { label: 'ID Card Number', icon: 'card-outline' },
        { label: 'Company Name', icon: 'business-outline' },
        { label: 'Designation', icon: 'ribbon-outline' },
    ]
};

const getOptionsForTemplate = (templateId: string) => {
    // @ts-ignore
    const specific = FIELD_GROUPS[templateId] || [];
    return [...specific, ...FIELD_GROUPS.common];
};

interface QRCode {
    id: string;
    category: string;
    qr_number: string;
    status: 'generated' | 'activated' | 'expired';
    subscription_end?: string;
    linked_user_id?: string;
}

interface QRDetails {
    full_name?: string;
    student_name?: string;
    owner_name?: string;
    age?: number;
    father_name?: string;
    mother_name?: string;
    school_name?: string;
    home_address?: string;
    blood_group?: string;
    medical_conditions?: string;
    additional_data?: any;
}

interface EmergencyContact {
    id: string;
    name: string;
    phone: string;
    relationship: string;
}

export default function SafetyQRViewerScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    // @ts-ignore
    const { qrId, qrUrl, scannedInApp } = route.params || {};

    const [loading, setLoading] = useState(true);
    const [activating, setActivating] = useState(false);
    const [qrCode, setQrCode] = useState<QRCode | null>(null);
    const [qrDetails, setQrDetails] = useState<QRDetails | null>(null);
    const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
    const [isOwner, setIsOwner] = useState(false);
    const { passcode, setPasscode } = useAuthStore();
    const [newPasscode, setNewPasscode] = useState('');

    // Template Selection
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

    // Form State
    const [formData, setFormData] = useState({
        fullName: '',
        age: '',
        address: '',
        ec1Name: '',
        ec1Phone: '+91',
        ec1Rel: '',
        ec2Name: '',
        ec2Phone: '+91',
        ec2Rel: ''
    });

    const [additionalFields, setAdditionalFields] = useState<any[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [useCaseModalVisible, setUseCaseModalVisible] = useState(false);
    const [customImage, setCustomImage] = useState<string | null>(null);

    const handleEdit = () => {
        const template = qrCode ? (SAFETY_TEMPLATES.find(t => t.id === qrCode.category) || SAFETY_TEMPLATES.find(t => t.id === 'custom')) : SAFETY_TEMPLATES.find(t => t.id === 'custom');

        // Populate Form
        setFormData({
            fullName: qrDetails?.full_name || '',
            age: qrDetails?.age ? qrDetails.age.toString() : '',
            address: qrDetails?.home_address || '',
            ec1Name: emergencyContacts[0]?.name || '',
            ec1Phone: emergencyContacts[0]?.phone || '',
            ec1Rel: emergencyContacts[0]?.relationship || '',
            ec2Name: emergencyContacts[1]?.name || '',
            ec2Phone: emergencyContacts[1]?.phone || '',
            ec2Rel: emergencyContacts[1]?.relationship || '',
        });

        if (qrDetails?.additional_data?.custom_fields) {
            setAdditionalFields(qrDetails.additional_data.custom_fields);
        }

        if (qrDetails?.additional_data?.profile_image) {
            setCustomImage(qrDetails.additional_data.profile_image);
        }

        // Switch to Setup Mode
        // We do this by modifying state to make it look like "scanned in app but not activated"? 
        // No, current logic is check qrCode.status. 
        // We need a way to FORCE 'edit' mode. 
        // I will add a local state override.
        setSelectedTemplate(template || null);
        setIsEditing(true);
    };

    const [isEditing, setIsEditing] = useState(false);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled && result.assets[0].base64) {
            setCustomImage("data:image/jpeg;base64," + result.assets[0].base64);
        }
    };

    const addField = (option: any) => {
        const limit = selectedTemplate?.id === 'custom' ? 15 : 10;
        if (additionalFields.length >= limit) {
            Alert.alert('Limit Reached', `You can maximum add ${limit} fields in this category.`);
            return;
        }

        setAdditionalFields([...additionalFields, {
            label: option.isCustom ? '' : option.label,
            value: '',
            icon: option.icon,
            isCustomLabel: option.isCustom
        }]);
        setModalVisible(false);
    };

    const removeField = (index: number) => {
        const newFields = [...additionalFields];
        newFields.splice(index, 1);
        setAdditionalFields(newFields);
    };

    const handleActivate = async () => {
        if (!formData.fullName || !formData.ec1Name || !formData.ec1Phone) {
            Alert.alert("Missing Fields", "Please enter at least Name and Primary Emergency Contact.");
            return;
        }

        if (!passcode && (!newPasscode || newPasscode.length !== 4)) {
            Alert.alert("App Passcode Required", "Please create a 4-digit passcode to secure your dashboard.");
            return;
        }

        try {
            setActivating(true);

            // 1. Insert/Update Details
            // First check if details exist to decide update vs insert (though generated usually means empty)
            const { error: detailsError } = await supabase
                .from('qr_details')
                .upsert({
                    qr_id: qrId,
                    category: selectedTemplate?.id,
                    full_name: formData.fullName,
                    age: parseInt(formData.age) || null,
                    home_address: formData.address,
                    additional_data: {
                        setup_via: 'app',
                        template_id: selectedTemplate?.id,
                        custom_fields: additionalFields,
                        profile_image: customImage
                    }
                });

            if (detailsError) throw detailsError;

            // 2. Insert Contacts
            const contacts = [
                {
                    qr_id: qrId,
                    name: formData.ec1Name,
                    phone: formData.ec1Phone,
                    relationship: formData.ec1Rel,
                    priority: 1
                }
            ];

            if (formData.ec2Name && formData.ec2Phone) {
                contacts.push({
                    qr_id: qrId,
                    name: formData.ec2Name,
                    phone: formData.ec2Phone,
                    relationship: formData.ec2Rel,
                    priority: 2
                });
            }

            // Delete old contacts if any to be safe
            await supabase.from('emergency_contacts').delete().eq('qr_id', qrId);

            const { error: contactsError } = await supabase
                .from('emergency_contacts')
                .insert(contacts);

            if (contactsError) throw contactsError;

            // 3. Update Status
            const { data: { user } } = await supabase.auth.getUser();

            const { error: updateError } = await supabase
                .from('qr_codes')
                .update({
                    status: 'activated',
                    linked_user_id: user?.id,
                })
                .eq('id', qrId);

            if (updateError) throw updateError;

            // Set App Passcode if new
            if (!passcode && newPasscode) {
                await setPasscode(newPasscode);
            }

            // Ensure QR is claimed (persisted locally)
            await useAuthStore.getState().claimQr(qrId);

            // Add to family profiles for switching
            useAuthStore.getState().addFamilyProfile({
                id: qrId, // Use QR ID as the profile ID for switching
                full_name: formData.fullName,
                email: qrCode?.qr_number || 'Safety-QR', // Added optional chaining
                phone_number: formData.ec1Phone
            });

            Alert.alert(
                "System Activated",
                isEditing ? "Safety profile has been updated." : "Your Safety QR is now active and protected. Let's finalize your security.",
                [
                    {
                        text: "Continue",
                        onPress: () => {
                            setIsEditing(false);
                            // Navigate to Passcode. If just set, it will ask to verify. 
                            // If missing, it will ask to create.
                            navigation.navigate('Passcode' as never);
                        }
                    }
                ]
            );

        } catch (error: any) {
            console.error('Activation Error:', error);
            Alert.alert("Error", error.message || "Failed to activate QR");
        } finally {
            setActivating(false);
        }
    };

    useEffect(() => {
        if (qrId) {
            loadQRData();
        }
    }, [qrId]);

    async function loadQRData() {
        try {
            setLoading(true);

            const { data: { user } } = await supabase.auth.getUser();

            // Fetch QR code by ID
            const { data: qr, error: qrError } = await supabase
                .from('qr_codes')
                .select('*')
                .eq('id', qrId)
                .single();

            if (qrError) throw qrError;

            if (user && qr.linked_user_id === user.id) {
                setIsOwner(true);
            } else {
                setIsOwner(false);
            }

            setQrCode(qr);

            // If activated, fetch details and contacts
            if (qr.status === 'activated') {
                const { data: details } = await supabase
                    .from('qr_details')
                    .select('*')
                    .eq('qr_id', qr.id)
                    .single();

                const { data: contacts } = await supabase
                    .from('emergency_contacts')
                    .select('*')
                    .eq('qr_id', qr.id)
                    .order('priority', { ascending: true });

                if (details) setQrDetails(details);
                if (contacts) setEmergencyContacts(contacts);
            }
        } catch (error: any) {
            console.error('Error loading QR data:', error);
            Alert.alert('Error', 'Failed to load QR code data');
        } finally {
            setLoading(false);
        }
    }

    function handleOpenInBrowser() {
        if (qrUrl) {
            Linking.openURL(qrUrl);
        }
    }

    function handleCall(phoneNumber: string) {
        Linking.openURL(`tel:${phoneNumber}`);
    }

    function handleWhatsApp(phoneNumber: string) {
        const cleanNumber = phoneNumber.replace(/\D/g, '');
        Linking.openURL(`https://wa.me/${cleanNumber}`);
    }

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Loading QR Data...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!qrCode) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={64} color={colors.error} />
                    <Text style={styles.errorTitle}>QR Code Not Found</Text>
                    <Text style={styles.errorText}>The QR code you scanned is invalid or does not exist.</Text>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Text style={styles.backButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // If QR is not activated or Editing
    if (qrCode.status === 'generated' || isEditing) {
        // If scanned within app, show native setup
        if (scannedInApp || isEditing) {
            // 1. Template Selection
            if (!selectedTemplate) {
                return (
                    <SafeAreaView style={styles.container}>
                        <View style={styles.header}>
                            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color={colors.secondary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.setupTitle}>Choose Protection Type</Text>
                        <Text style={styles.setupText}>Select a category to auto-configure details.</Text>

                        <TouchableOpacity style={{ alignSelf: 'center', marginBottom: 20, padding: 8, backgroundColor: '#eef2ff', borderRadius: 8 }} onPress={() => setUseCaseModalVisible(true)}>
                            <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Explore 40+ Use Cases ➜</Text>
                        </TouchableOpacity>

                        <Modal
                            visible={useCaseModalVisible}
                            transparent={true}
                            animationType="slide"
                            onRequestClose={() => setUseCaseModalVisible(false)}
                        >
                            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setUseCaseModalVisible(false)}>
                                <View style={styles.modalContent}>
                                    <Text style={styles.modalTitle}>Where to use Safety QR?</Text>
                                    <ScrollView style={{ maxHeight: 400 }}>
                                        <Text style={{ lineHeight: 28, fontSize: 16, color: colors.secondary, padding: 10 }}>
                                            • Missing Child Recovery{'\n'}
                                            • Senior Citizen Lost ID{'\n'}
                                            • Accident Victim ID{'\n'}
                                            • Lost Luggage / Bag{'\n'}
                                            • Keys & Wallet Recovery{'\n'}
                                            • Vehicle Safety / Mechanics{'\n'}
                                            • Pet Lost & Found{'\n'}
                                            • Laptop / Gadget Safety{'\n'}
                                            • Employee ID Tag{'\n'}
                                            • Event / Crowd Control{'\n'}
                                            • Medical Alert / Allergy{'\n'}
                                            • Disaster Relief ID{'\n'}
                                            • Door / Home Security{'\n'}
                                            • Bicycle Anti-Theft{'\n'}
                                            • School Bag Tag{'\n'}
                                            • Passport / Travel Doc{'\n'}
                                            • Construction Helmet ID
                                        </Text>
                                    </ScrollView>
                                    <TouchableOpacity onPress={() => setUseCaseModalVisible(false)} style={[styles.activateButton, { marginTop: 10 }]}>
                                        <Text style={styles.activateButtonText}>Close</Text>
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        </Modal>

                        <FlatList
                            data={SAFETY_TEMPLATES}
                            numColumns={2}
                            columnWrapperStyle={{ justifyContent: 'space-between' }}
                            contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.templateCard, { borderColor: item.color }]}
                                    onPress={() => {
                                        setSelectedTemplate(item);
                                        setFormData(prev => ({
                                            ...prev,
                                            ec1Rel: item.fields.c1Rel,
                                            ec2Rel: item.fields.c2Rel
                                        }));
                                    }}
                                >
                                    <View style={[styles.iconBox, { backgroundColor: item.color + '20' }]}>
                                        <Ionicons name={item.icon as any} size={28} color={item.color} />
                                    </View>
                                    <Text style={styles.templateLabel}>{item.label}</Text>
                                    <Text style={styles.templateDesc}>{item.desc}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </SafeAreaView>
                );
            }

            // 2. Dynamic Form
            return (
                <SafeAreaView style={styles.container}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                        <ScrollView contentContainerStyle={styles.scrollContent}>
                            <View style={styles.header}>
                                <TouchableOpacity onPress={() => setSelectedTemplate(null)} style={styles.backButtonRow}>
                                    <Ionicons name="arrow-back" size={24} color={colors.secondary} />
                                    <Text style={styles.backText}>Change Category</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.centerContent}>
                                <TouchableOpacity style={styles.profileImageContainer} onPress={pickImage}>
                                    {customImage ? (
                                        <Image source={{ uri: customImage }} style={styles.profileImage} />
                                    ) : (
                                        <View style={{ alignItems: 'center' }}>
                                            <Ionicons name={selectedTemplate.icon as any} size={40} color={selectedTemplate.color} />
                                            <Text style={styles.addPhotoText}>+ ADD PHOTO</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>

                                <Text style={styles.setupTitle}>{selectedTemplate.label} Setup</Text>
                                <Text style={styles.setupText}>Fill details for {selectedTemplate.label.toLowerCase()} protection.</Text>
                            </View>

                            <View style={styles.formContainer}>
                                {!passcode && (
                                    <View style={{ marginBottom: spacing.xl, backgroundColor: colors.primary + '08', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: colors.primary + '20' }}>
                                        <Text style={[styles.sectionLabel, { color: colors.primary, marginTop: 0 }]}>Create App Passcode (Required)</Text>
                                        <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 12 }}>Set a 4-digit PIN to secure your health & safety data.</Text>
                                        <TextInput
                                            style={[styles.input, { letterSpacing: 8, fontWeight: 'bold', fontSize: 24, textAlign: 'center', backgroundColor: colors.white }]}
                                            placeholder="XXXX"
                                            placeholderTextColor={colors.textMuted}
                                            keyboardType="number-pad"
                                            maxLength={4}
                                            secureTextEntry
                                            value={newPasscode}
                                            onChangeText={setNewPasscode}
                                        />
                                    </View>
                                )}

                                <Text style={styles.sectionLabel}>{selectedTemplate.fields.name}</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder={`Enter ${selectedTemplate.fields.name}`}
                                    placeholderTextColor={colors.textMuted}
                                    value={formData.fullName}
                                    onChangeText={t => setFormData({ ...formData, fullName: t })}
                                />

                                <Text style={styles.sectionLabel}>{selectedTemplate.fields.age}</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder={`Enter ${selectedTemplate.fields.age}`}
                                    placeholderTextColor={colors.textMuted}
                                    value={formData.age}
                                    onChangeText={t => setFormData({ ...formData, age: t })}
                                />

                                <Text style={styles.sectionLabel}>{selectedTemplate.fields.address}</Text>
                                <TextInput
                                    style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                                    placeholder={`Enter ${selectedTemplate.fields.address}`}
                                    placeholderTextColor={colors.textMuted}
                                    value={formData.address}
                                    onChangeText={t => setFormData({ ...formData, address: t })}
                                    multiline
                                />

                                <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>{selectedTemplate.fields.c1}</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Name"
                                    placeholderTextColor={colors.textMuted}
                                    value={formData.ec1Name}
                                    onChangeText={t => setFormData({ ...formData, ec1Name: t })}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Phone Number"
                                    keyboardType="phone-pad"
                                    placeholderTextColor={colors.textMuted}
                                    value={formData.ec1Phone}
                                    onChangeText={t => setFormData({ ...formData, ec1Phone: t })}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder={`Relation (e.g. ${selectedTemplate.fields.c1Rel})`}
                                    placeholderTextColor={colors.textMuted}
                                    value={formData.ec1Rel}
                                    onChangeText={t => setFormData({ ...formData, ec1Rel: t })}
                                />

                                <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>{selectedTemplate.fields.c2} (Optional)</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Name"
                                    placeholderTextColor={colors.textMuted}
                                    value={formData.ec2Name}
                                    onChangeText={t => setFormData({ ...formData, ec2Name: t })}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Phone Number"
                                    keyboardType="phone-pad"
                                    placeholderTextColor={colors.textMuted}
                                    value={formData.ec2Phone}
                                    onChangeText={t => setFormData({ ...formData, ec2Phone: t })}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder={`Relation (e.g. ${selectedTemplate.fields.c2Rel})`}
                                    placeholderTextColor={colors.textMuted}
                                    value={formData.ec2Rel}
                                    onChangeText={t => setFormData({ ...formData, ec2Rel: t })}
                                />

                                {/* Additional Fields Section */}
                                <Text style={[styles.sectionLabel, { marginTop: spacing.xl, color: colors.primary }]}>Additional Information</Text>

                                {additionalFields.map((field, index) => (
                                    <View key={index} style={{ marginBottom: spacing.sm }}>
                                        <View style={styles.customFieldRow}>
                                            <Ionicons name={field.icon as any} size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
                                            <Text style={[styles.sectionLabel, { flex: 1, marginTop: 0 }]}>{field.label}</Text>
                                            <TouchableOpacity onPress={() => removeField(index)} style={styles.deleteButton}>
                                                <Ionicons name="trash-outline" size={18} color={colors.error} />
                                            </TouchableOpacity>
                                        </View>
                                        <TextInput
                                            style={styles.input}
                                            placeholder={`Enter ${field.label}`}
                                            placeholderTextColor={colors.textMuted}
                                            value={field.value}
                                            onChangeText={t => {
                                                const newFields = [...additionalFields];
                                                newFields[index].value = t;
                                                setAdditionalFields(newFields);
                                            }}
                                        />
                                    </View>
                                ))}

                                <TouchableOpacity style={styles.addFieldButton} onPress={() => setModalVisible(true)}>
                                    <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                                    <Text style={styles.addFieldText}>Add More Information</Text>
                                </TouchableOpacity>


                                <TouchableOpacity
                                    style={[styles.activateButton, { backgroundColor: selectedTemplate.color }, activating && { opacity: 0.7 }]}
                                    onPress={handleActivate}
                                    disabled={activating}
                                >
                                    {activating ? (
                                        <ActivityIndicator color={colors.white} />
                                    ) : (
                                        <Text style={styles.activateButtonText}>{isEditing ? 'Update Profile' : 'Activate Protection'}</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                    {/* Options Modal */}
                    <Modal
                        animationType="slide"
                        transparent={true}
                        visible={modalVisible}
                        onRequestClose={() => setModalVisible(false)}
                    >
                        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>Select Information to Add</Text>
                                <ScrollView>
                                    {getOptionsForTemplate(selectedTemplate.id).map((option: any, index: number) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={styles.modalOption}
                                            onPress={() => addField(option)}
                                        >
                                            <View style={{ width: 32, alignItems: 'center' }}>
                                                <Ionicons name={option.icon as any} size={22} color={colors.primary} />
                                            </View>
                                            <Text style={styles.modalOptionText}>{option.label}</Text>
                                            <Ionicons name="add" size={20} color={colors.border} style={{ marginLeft: 'auto' }} />
                                        </TouchableOpacity>
                                    ))}
                                    <View style={{ height: 40 }} />
                                </ScrollView>
                            </View>
                        </TouchableOpacity>
                    </Modal>

                </SafeAreaView>
            );
        }

        return (
            <SafeAreaView style={styles.container}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={colors.secondary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.setupContainer}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="shield-checkmark" size={64} color={colors.primary} />
                        </View>
                        <Text style={styles.setupTitle}>Setup Required</Text>
                        <Text style={styles.setupText}>
                            This Safety QR code needs to be activated. Please complete the setup in your browser.
                        </Text>

                        <View style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>{qrCode.category.replace('-', ' ').toUpperCase()}</Text>
                        </View>

                        <TouchableOpacity style={styles.browserButton} onPress={handleOpenInBrowser}>
                            <Ionicons name="open-outline" size={20} color={colors.white} />
                            <Text style={styles.browserButtonText}>Open Setup Form in Browser</Text>
                        </TouchableOpacity>

                        {/* Add Dashboard Navigation Button */}
                        <TouchableOpacity
                            style={styles.dashboardButton}
                            onPress={() => {
                                // @ts-ignore
                                navigation.navigate('MainTabs');
                            }}
                        >
                            <Ionicons name="home-outline" size={20} color={colors.primary} />
                            <Text style={styles.dashboardButtonText}>Go to Dashboard</Text>
                        </TouchableOpacity>

                        {/* Add Refresh Button */}
                        <TouchableOpacity
                            style={styles.refreshButton}
                            onPress={() => {
                                loadQRData();
                                Alert.alert('Refreshed', 'QR data refreshed. If you filled the form, it should show now.');
                            }}
                        >
                            <Ionicons name="refresh-outline" size={20} color={colors.textSecondary} />
                            <Text style={styles.refreshButtonText}>Refresh Data</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    // Check subscription expiration
    if (qrCode.subscription_end && new Date(qrCode.subscription_end) < new Date()) {
        return (
            <SafeAreaView style={styles.container}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={colors.secondary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.expiredContainer}>
                        <Ionicons name="alert-circle" size={64} color={colors.error} />
                        <Text style={styles.expiredTitle}>Subscription Expired</Text>
                        <Text style={styles.expiredText}>
                            The safety service for this QR code has expired. Please renew to restore access.
                        </Text>
                        <TouchableOpacity style={styles.supportButton} onPress={() => Linking.openURL('tel:+919876543210')}>
                            <Text style={styles.supportButtonText}>Contact Support</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    // Active QR - Show safety info
    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color={colors.secondary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Safety Profile</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Passcode' as never)} style={styles.moreButton}>
                        <Ionicons name="grid-outline" size={20} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                {/* Category Badge */}
                <View style={styles.categoryBadgeActive}>
                    <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
                    <Text style={styles.categoryTextActive}>{qrCode.category.replace('-', ' ')}</Text>
                </View>

                {/* Emergency Contacts */}
                {emergencyContacts.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="call" size={20} color={colors.success} />
                            <Text style={styles.sectionTitle}>Emergency Contacts</Text>
                        </View>
                        {emergencyContacts.map((contact) => (
                            <View key={contact.id} style={styles.contactCard}>
                                <View style={styles.contactInfo}>
                                    <Text style={styles.contactName}>{contact.name}</Text>
                                    <Text style={styles.contactRelation}>{contact.relationship}</Text>
                                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                                        {isOwner ? contact.phone : contact.phone.replace(/\d(?=\d{4})/g, 'X')}
                                    </Text>
                                </View>
                                <View style={styles.contactActions}>
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={() => handleCall(contact.phone)}
                                    >
                                        <Ionicons name="call" size={18} color={colors.success} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={() => handleWhatsApp(contact.phone)}
                                    >
                                        <Ionicons name="logo-whatsapp" size={18} color={colors.success} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Identity Details */}
                {qrDetails && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="person" size={20} color={colors.primary} />
                            <Text style={styles.sectionTitle}>Identity Details</Text>
                        </View>
                        <View style={styles.detailsContainer}>
                            {renderDetailRow('Name', qrDetails.full_name || qrDetails.student_name || qrDetails.owner_name)}
                            {renderDetailRow('Age', qrDetails.age ? `${qrDetails.age} Years` : null)}
                            {renderDetailRow('Father', qrDetails.father_name)}
                            {renderDetailRow('Mother', qrDetails.mother_name)}
                            {renderDetailRow('School', qrDetails.school_name || qrDetails.additional_data?.school_name)}
                            {renderDetailRow('Address', qrDetails.home_address)}
                            {renderDetailRow('Blood Group', qrDetails.blood_group)}
                            {renderDetailRow('Medical', qrDetails.medical_conditions)}
                        </View>
                    </View>
                )}

                {/* Actions */}
                <View style={{ gap: 12, marginBottom: 20 }}>
                    {isOwner && (
                        <TouchableOpacity style={styles.fullFeaturesButton} onPress={handleEdit}>
                            <Ionicons name="create-outline" size={20} color={colors.primary} />
                            <Text style={styles.fullFeaturesText}>Edit / Change Category</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity style={styles.fullFeaturesButton} onPress={() => {
                        // @ts-ignore
                        navigation.navigate('Passcode' as never);
                    }}>
                        <Ionicons name="grid-outline" size={20} color={colors.primary} />
                        <Text style={styles.fullFeaturesText}>Go to Dashboard</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function renderDetailRow(label: string, value?: string | number | null) {
    if (!value) return null;
    return (
        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={styles.detailValue}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollContent: {
        padding: spacing.lg,
        paddingBottom: spacing.xxxl,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: spacing.md,
        fontSize: 16,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    errorTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.secondary,
        marginTop: spacing.md,
        marginBottom: spacing.sm,
    },
    errorText: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
    backButton: {
        marginTop: spacing.xl,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        backgroundColor: colors.primary,
        borderRadius: 12,
    },
    backButtonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.secondary,
    },
    moreButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    setupContainer: {
        alignItems: 'center',
        paddingVertical: spacing.xxl,
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    setupTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: colors.secondary,
        marginBottom: spacing.md,
        textAlign: 'center',
    },
    setupText: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: spacing.xl,
        paddingHorizontal: spacing.lg,
    },
    categoryBadge: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        backgroundColor: colors.primary + '20',
        borderRadius: 20,
        marginBottom: spacing.xxl,
    },
    // Template Styles
    templateCard: {
        width: '48%',
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: spacing.md,
        marginBottom: spacing.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    iconBox: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    templateLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.secondary,
        marginBottom: 4,
        textAlign: 'center',
    },
    templateDesc: {
        fontSize: 10,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    backButtonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.sm,
    },
    backText: {
        marginLeft: spacing.xs,
        color: colors.secondary,
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2
    },
    formContainer: {
        width: '100%',
        gap: spacing.md,
        marginBottom: spacing.xxl,
    },
    centerContent: {
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    profileImageContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#f1f2f6',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: spacing.lg,
        overflow: 'hidden',
        borderWidth: 3,
        borderColor: colors.white,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    profileImage: {
        width: '100%',
        height: '100%',
    },
    addPhotoText: {
        fontSize: 10,
        color: colors.primary,
        marginTop: 4,
        fontWeight: 'bold',
    },
    addFieldButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.md,
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        borderStyle: 'dashed',
        marginTop: spacing.md,
    },
    addFieldText: {
        marginLeft: 8,
        color: colors.primary,
        fontWeight: '600',
    },
    customFieldRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    deleteButton: {
        padding: spacing.sm,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: spacing.lg,
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: spacing.lg,
        textAlign: 'center',
        color: colors.secondary,
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f1f1',
    },
    modalOptionText: {
        fontSize: 16,
        marginLeft: 16,
        color: colors.secondary,
        fontWeight: '500',
    },
    input: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: spacing.lg,
        paddingVertical: 14,
        borderRadius: 16,
        fontSize: 16,
        color: colors.secondary,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    sectionLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginLeft: 4,
        marginTop: spacing.sm,
    },
    activateButton: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.lg,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: spacing.xl,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    activateButtonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.primary,
        letterSpacing: 1,
    },
    browserButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        backgroundColor: colors.primary,
        borderRadius: 16,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    browserButtonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
    dashboardButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        backgroundColor: colors.white,
        borderRadius: 16,
        marginTop: spacing.md,
        borderWidth: 2,
        borderColor: colors.primary,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    dashboardButtonText: {
        color: colors.primary,
        fontSize: 16,
        fontWeight: '700',
    },
    refreshButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.sm,
        marginTop: spacing.md,
    },
    refreshButtonText: {
        color: colors.textSecondary,
        fontSize: 14,
        fontWeight: '600',
    },
    expiredContainer: {
        alignItems: 'center',
        paddingVertical: spacing.xxl,
    },
    expiredTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.secondary,
        marginTop: spacing.md,
        marginBottom: spacing.sm,
    },
    expiredText: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: spacing.xl,
        paddingHorizontal: spacing.lg,
    },
    supportButton: {
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        backgroundColor: colors.white,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: colors.primary,
    },
    supportButtonText: {
        color: colors.primary,
        fontSize: 16,
        fontWeight: '700',
    },
    categoryBadgeActive: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        backgroundColor: colors.white,
        borderRadius: 20,
        alignSelf: 'center',
        marginBottom: spacing.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    categoryTextActive: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.secondary,
        textTransform: 'capitalize',
    },
    section: {
        backgroundColor: colors.white,
        borderRadius: 24,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.secondary,
    },
    contactCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    contactInfo: {
        flex: 1,
    },
    contactName: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.secondary,
        marginBottom: 2,
    },
    contactRelation: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    contactActions: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    actionButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.success + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailsContainer: {
        gap: spacing.xs,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    detailLabel: {
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    detailValue: {
        fontSize: 14,
        color: colors.secondary,
        fontWeight: '700',
        textAlign: 'right',
        flex: 1,
        marginLeft: spacing.md,
    },
    fullFeaturesButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.lg,
        backgroundColor: colors.white,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: colors.primary,
        borderStyle: 'dashed',
    },
    fullFeaturesText: {
        color: colors.primary,
        fontSize: 14,
        fontWeight: '700',
    },
});
