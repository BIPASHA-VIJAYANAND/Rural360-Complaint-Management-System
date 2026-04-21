import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '../constants/theme';
import { GovButton } from '../components/GovComponents';

export default function LoginSelectorScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Gov Header Area */}
                <View style={styles.header}>
                    <View style={styles.emblemPlaceHolder}>
                        {/* If you have an emblem image, place it here */}
                        <Text style={styles.emblemText}>⍟</Text>
                    </View>
                    <Text style={styles.title}>GRAM PANCHAYAT</Text>
                    <Text style={styles.subtitle}>Grievance Redressal Portal</Text>
                    <View style={styles.saffronBorder} />
                </View>

                {/* Role Selection */}
                <View style={styles.cardContainer}>
                    <Text style={styles.selectionTitle}>Select Portal Type</Text>

                    <View style={styles.roleCard}>
                        <View style={[styles.roleIcon, { backgroundColor: Colors.primaryLight }]} />
                        <View style={styles.roleInfo}>
                            <Text style={styles.roleTitle}>Citizen Services</Text>
                            <Text style={styles.roleDesc}>File and track your grievances online</Text>
                            <GovButton 
                                title="PROCEED AS CITIZEN" 
                                onPress={() => router.push('/citizen-login')}
                                style={styles.roleBtn}
                            />
                        </View>
                    </View>

                    <View style={styles.roleCard}>
                        <View style={[styles.roleIcon, { backgroundColor: Colors.secondary }]} />
                        <View style={styles.roleInfo}>
                            <Text style={styles.roleTitle}>Admin & Staff Panel</Text>
                            <Text style={styles.roleDesc}>Manage grievances and staff operations</Text>
                            <GovButton 
                                title="STAFF LOGIN" 
                                type="secondary"
                                onPress={() => router.push('/admin-login')}
                                style={styles.roleBtn}
                            />
                        </View>
                    </View>
                </View>

                {/* Footer Notice */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>© 2026 Ministry of Panchayati Raj</Text>
                    <Text style={styles.footerSubText}>Digital India Initiative</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scrollContent: { flexGrow: 1, padding: Spacing.lg },
    
    header: {
        alignItems: 'center',
        marginTop: Spacing.xl,
        marginBottom: Spacing.xl,
        backgroundColor: Colors.primary,
        padding: Spacing.lg,
        borderRadius: Radius.md,
    },
    emblemPlaceHolder: {
        width: 60, height: 60,
        backgroundColor: Colors.secondary,
        borderRadius: 30,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: Spacing.md,
    },
    emblemText: { fontSize: 32, color: Colors.white },
    title: { fontSize: 22, fontWeight: '800', color: Colors.white, letterSpacing: 1 },
    subtitle: { fontSize: 13, color: Colors.grey[200], marginTop: 4, textTransform: 'uppercase' },
    saffronBorder: { 
        height: 4, width: '100%', 
        backgroundColor: Colors.secondary, 
        marginTop: Spacing.md,
        borderRadius: Radius.xs 
    },

    selectionTitle: { 
        fontSize: 16, fontWeight: '700', 
        color: Colors.primary, 
        textAlign: 'center', 
        marginBottom: Spacing.lg,
        textTransform: 'uppercase'
    },
    
    cardContainer: { gap: Spacing.md },
    roleCard: {
        backgroundColor: Colors.white,
        flexDirection: 'row',
        padding: Spacing.md,
        borderRadius: Radius.md,
        borderWidth: 1, borderColor: Colors.grey[100],
        elevation: 2, shadowColor: '#000', shadowOffset: { height: 2, width: 0 }, shadowOpacity: 0.1, shadowRadius: 3,
    },
    roleIcon: { width: 50, height: 50, borderRadius: Radius.sm, marginRight: Spacing.md },
    roleInfo: { flex: 1 },
    roleTitle: { fontSize: 18, fontWeight: '700', color: Colors.primaryDark, marginBottom: 2 },
    roleDesc: { fontSize: 13, color: Colors.grey[700], marginBottom: Spacing.md },
    roleBtn: { height: 40, paddingVertical: 0 },
    
    footer: { marginTop: Spacing.xl, alignItems: 'center', opacity: 0.5 },
    footerText: { fontSize: 12, fontWeight: '600', color: Colors.primary },
    footerSubText: { fontSize: 10, color: Colors.grey[700] },
});
