import { create } from 'zustand';
import { supabase, AppUser } from '../services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FamilyProfile {
    id: string;
    full_name: string;
    email: string;
    phone_number?: string;
}

interface AuthState {
    user: AppUser | null;
    session: any | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    hasScannedQR: boolean;
    passcode: string | null;
    isLocked: boolean;
    familyProfiles: FamilyProfile[];
    claimedQrIds: string[];

    // Actions
    setUser: (user: AppUser | null) => void;
    setSession: (session: any | null) => void;
    checkSession: () => Promise<void>;
    login: (phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
    register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    updateProfile: (data: Partial<AppUser>) => Promise<{ success: boolean; error?: string }>;
    bypassAuth: (userData?: Partial<AppUser>) => void;
    switchProfile: (profileId: string) => void;
    addFamilyProfile: (profile: FamilyProfile) => void;
    claimQr: (id: string) => Promise<void>;

    // Passcode Actions
    setPasscode: (code: string) => Promise<void>;
    unlock: (code: string) => boolean;
    lock: () => void;
    setHasScannedQR: (val: boolean) => void;
}

interface RegisterData {
    phone_number: string;
    email?: string;
    full_name: string;
    password: string;
    qr_code_id?: string;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    session: null,
    isLoading: true, // Start with loading to check storage
    isAuthenticated: false,
    hasScannedQR: false,
    passcode: null,
    isLocked: true,
    familyProfiles: [],
    claimedQrIds: [],

    setUser: (user) => set({ user, isAuthenticated: !!user }),

    setSession: (session) => set({ session }),

    checkSession: async () => {
        try {
            set({ isLoading: true });

            // Load persistent states
            const [savedProfiles, savedHasScanned, savedPasscode, savedClaimedQrs] = await Promise.all([
                AsyncStorage.getItem('family_profiles'),
                AsyncStorage.getItem('has_scanned_qr'),
                AsyncStorage.getItem('app_passcode'),
                AsyncStorage.getItem('claimed_qr_ids')
            ]);

            const familyProfiles = savedProfiles ? JSON.parse(savedProfiles) : [];
            const hasScannedQR = savedHasScanned === 'true';
            const passcode = savedPasscode;
            const claimedQrIds = savedClaimedQrs ? JSON.parse(savedClaimedQrs) : [];

            set({ familyProfiles, hasScannedQR, passcode, claimedQrIds, isLocked: !!passcode });

            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError) throw sessionError;

            if (session?.user) {
                set({ session });

                const { data: user, error: profileError } = await supabase
                    .from('app_users')
                    .select('*')
                    .eq('id', session.user.id)
                    .maybeSingle();

                if (user && !profileError) {
                    set({ user, isAuthenticated: true });
                    get().addFamilyProfile({
                        id: user.id,
                        full_name: user.full_name,
                        email: user.email,
                        phone_number: user.phone_number
                    });
                }
            }
        } catch (error) {
            console.error('Session check failed:', error);
        } finally {
            set({ isLoading: false });
        }
    },

    login: async (email, password) => {
        try {
            set({ isLoading: true });
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            if (data.session) {
                set({ session: data.session });

                const { data: user } = await supabase
                    .from('app_users')
                    .select('*')
                    .eq('id', data.user.id)
                    .maybeSingle();

                const finalUser = user || { id: data.user.id, email: email, full_name: 'User' };
                set({ user: finalUser as any, isAuthenticated: true });

                get().addFamilyProfile({
                    id: finalUser.id,
                    full_name: finalUser.full_name,
                    email: finalUser.email,
                    phone_number: (finalUser as any).phone_number
                });

                return { success: true };
            }

            return { success: false, error: 'Authentication failed.' };
        } catch (error: any) {
            console.error('Login error:', error);
            return { success: false, error: error.message || 'Login failed' };
        } finally {
            set({ isLoading: false });
        }
    },

    register: async (data) => {
        try {
            set({ isLoading: true });
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: data.email!,
                password: data.password,
                options: { data: { full_name: data.full_name } }
            });

            if (authError) throw authError;

            if (authData.user && authData.session) {
                const newUser = {
                    id: authData.user.id,
                    email: data.email,
                    full_name: data.full_name,
                    phone_number: data.phone_number
                };
                set({ user: newUser as any, session: authData.session, isAuthenticated: true });

                get().addFamilyProfile({
                    id: newUser.id,
                    full_name: newUser.full_name,
                    email: newUser.email!,
                    phone_number: newUser.phone_number
                });

                return { success: true };
            }
            return { success: true, error: 'Check email for verification' };
        } catch (error: any) {
            return { success: false, error: error.message };
        } finally {
            set({ isLoading: false });
        }
    },

    logout: async () => {
        try {
            await supabase.auth.signOut();
            set({ user: null, session: null, isAuthenticated: false });
        } catch (error) {
            console.error('Logout error:', error);
        }
    },

    updateProfile: async (data) => {
        try {
            const { user } = get();
            if (!user) return { success: false, error: 'Not authenticated' };
            set({ user: { ...user, ...data } });

            // Also update in family profiles
            const { familyProfiles } = get();
            const updatedFamily = familyProfiles.map(p => p.id === user.id ? { ...p, ...data } : p);
            set({ familyProfiles: updatedFamily });
            AsyncStorage.setItem('family_profiles', JSON.stringify(updatedFamily));

            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    bypassAuth: (userData) => {
        const guestUser = {
            id: 'guest-' + Date.now(),
            full_name: userData?.full_name || 'Guest User',
            email: userData?.email || 'guest@safetyqr.ai',
            phone_number: userData?.phone_number
        };
        set({ isAuthenticated: true, user: guestUser as any, hasScannedQR: true });
        AsyncStorage.setItem('has_scanned_qr', 'true');
        get().addFamilyProfile(guestUser);
    },

    addFamilyProfile: (profile) => {
        const { familyProfiles } = get();
        if (!familyProfiles.find(p => p.id === profile.id)) {
            const newProfiles = [...familyProfiles, profile];
            set({ familyProfiles: newProfiles });
            AsyncStorage.setItem('family_profiles', JSON.stringify(newProfiles));
        }
    },

    switchProfile: (profileId) => {
        const { familyProfiles } = get();
        const profile = familyProfiles.find(p => p.id === profileId);
        if (profile) {
            set({ user: profile as any, isAuthenticated: true });
        }
    },

    setPasscode: async (code) => {
        set({ passcode: code, isLocked: false });
        await AsyncStorage.setItem('app_passcode', code);
    },

    unlock: (code) => {
        if (get().passcode === code) {
            set({ isLocked: false });
            return true;
        }
        return false;
    },

    lock: () => set({ isLocked: true }),

    setHasScannedQR: (val) => {
        set({ hasScannedQR: val });
        AsyncStorage.setItem('has_scanned_qr', val ? 'true' : 'false');
    },

    claimQr: async (id) => {
        const { claimedQrIds } = get();
        if (!claimedQrIds.includes(id)) {
            const newIds = [id, ...claimedQrIds];
            set({ claimedQrIds: newIds });
            await AsyncStorage.setItem('claimed_qr_ids', JSON.stringify(newIds));
        }
    }
}));
