import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

// Premium Color Palette - SafetyQR Ultra Theme
export const colors = {
    // Brand Colors - Deep, rich tones
    primary: '#6366F1', // Indigo 500
    primaryDark: '#4338CA', // Indigo 700
    primaryLight: '#818CF8', // Indigo 400
    
    accent: '#10B981', // Emerald 500 - For "Safe" status
    accentLight: '#D1FAE5',

    // Secondary Brand
    secondary: '#0F172A', // Slate 900
    secondaryLight: '#334155', // Slate 700

    // Semantic Colors
    success: '#059669',
    warning: '#D97706',
    error: '#DC2626',   // High-vis Red for SOS
    info: '#2563EB',

    // UI Colors - Premium Slate UI
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceSubtle: '#F1F5F9',
    text: '#0F172A',       // Deepest Slate
    textSecondary: '#475569', // Muted Slate
    textMuted: '#94A3B8',    // Light Slate
    border: '#E2E8F0',
    borderStrong: '#CBD5E1',

    // Special SOS
    sos: {
        background: '#EF4444',
        glow: 'rgba(239, 68, 68, 0.4)',
        text: '#FFFFFF'
    },

    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
};

export const spacing = {
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
};

export const shadows = {
    none: {
        shadowColor: "transparent",
        elevation: 0,
    },
    soft: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    medium: {
        shadowColor: "#64748B",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
        elevation: 5,
    },
    premium: {
        shadowColor: "#4F46E5",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
    },
    sos: {
        shadowColor: "#EF4444",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 25,
        elevation: 15,
    }
};

export const theme = {
    ...MD3LightTheme,
    colors: {
        ...MD3LightTheme.colors,
        primary: colors.primary,
        secondary: colors.secondary,
        error: colors.error,
        background: colors.background,
        surface: colors.surface,
        onPrimary: colors.white,
        onSurface: colors.text,
        outline: colors.border,
    },
    roundness: 16, // More rounded for premium feel
};
