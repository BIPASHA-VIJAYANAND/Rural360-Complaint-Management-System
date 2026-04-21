import React from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius } from '../constants/theme';

/**
 * GOV BUTTON
 * Formal styled buttons matching the web's Navy/Saffron aesthetic.
 */
export const GovButton = ({ title, onPress, type = 'primary', style, loading }) => {
    const isSaffron = type === 'secondary';
    return (
        <TouchableOpacity 
            style={[
                styles.btn, 
                isSaffron ? styles.btnSaffron : styles.btnNavy, 
                style
            ]} 
            onPress={onPress}
            disabled={loading}
        >
            <Text style={styles.btnText}>{loading ? 'Please wait...' : title}</Text>
        </TouchableOpacity>
    );
};

/**
 * GOV INPUT
 * Standardized input fields with formal labels.
 */
export const GovInput = ({ label, placeholder, value, onChangeText, secureTextEntry, keyboardType, autoCapitalize }) => (
    <View style={styles.formGroup}>
        {label && <Text style={styles.label}>{label}</Text>}
        <TextInput 
            style={styles.input} 
            placeholder={placeholder}
            placeholderTextColor={Colors.grey[400]}
            value={value}
            onChangeText={onChangeText}
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
        />
    </View>
);

/**
 * STATUS BADGE
 * Small colored badges with status-specific text.
 */
export const StatusBadge = ({ status }) => {
    const raw = status?.toLowerCase().replace(' ', '') || 'submitted';
    const mapping = {
        'submitted': 'submitted',
        'underreview': 'review',
        'pendingapproval': 'pending', 
        'approved': 'approved',
        'assigned': 'assigned',
        'inprogress': 'progress',
        'completed': 'completed',
        'closed': 'closed'
    };
    const statusKey = mapping[raw] || 'submitted';
    const bg = Colors.status[statusKey];
    const text = Colors.text[statusKey];

    return (
        <View style={[styles.badge, { backgroundColor: bg }]}>
            <Text style={[styles.badgeText, { color: text }]}>{status?.toUpperCase()}</Text>
        </View>
    );
};

/**
 * KPI CARD
 * Analytical cards with top border accent.
 */
export const KPICard = ({ title, value, color }) => (
    <View style={[styles.kpiCard, { borderTopColor: color }]}>
        <Text style={styles.kpiValue}>{value}</Text>
        <Text style={styles.kpiLabel}>{title}</Text>
    </View>
);

const styles = StyleSheet.create({
    btn: {
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        borderRadius: Radius.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnNavy: { backgroundColor: Colors.primary },
    btnSaffron: { backgroundColor: Colors.secondary },
    btnText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
    
    formGroup: { marginBottom: Spacing.md },
    label: { fontSize: 13, fontWeight: '600', color: Colors.grey[700], marginBottom: 6 },
    input: {
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.grey[200],
        borderRadius: Radius.sm,
        padding: 10,
        fontSize: 15,
        color: Colors.grey[900],
    },
    
    badge: {
        paddingVertical: 2,
        paddingHorizontal: 8,
        borderRadius: Radius.xs,
        alignSelf: 'flex-start',
    },
    badgeText: { fontSize: 11, fontWeight: '700' },
    
    kpiCard: {
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.grey[200],
        borderTopWidth: 4,
        borderRadius: Radius.sm,
        padding: Spacing.md,
        alignItems: 'center',
        flex: 1,
        minWidth: 120,
    },
    kpiValue: { fontSize: 24, fontWeight: '700', color: Colors.primary },
    kpiLabel: { fontSize: 12, color: Colors.grey[700], marginTop: 4 },
});
