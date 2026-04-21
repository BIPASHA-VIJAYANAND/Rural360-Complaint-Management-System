import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, RefreshControl } from 'react-native';
import { Colors, Spacing, Radius } from '../../constants/theme';
import { KPICard, GovButton } from '../../components/GovComponents';
import api from '../../src/api/axios';
import { useAuth } from '../../src/context/AuthContext';
import { useRouter } from 'expo-router';

export default function CitizenDashboard() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0 });
    const [refreshing, setRefreshing] = useState(false);

    const loadStats = async () => {
        try {
            const res = await api.get('/complaints/stats');
            setStats(res.data);
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadStats();
        setRefreshing(false);
    };

    const handleLogout = async () => {
        await logout();
        router.replace('/');
    };

    useEffect(() => { loadStats(); }, []);

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView 
                contentContainerStyle={styles.scroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View style={styles.welcomeBox}>
                    <Text style={styles.welcomeText}>Welcome,</Text>
                    <Text style={styles.userName}>{user?.full_name || 'Citizen'}</Text>
                </View>

                <View style={styles.kpiRow}>
                    <KPICard title="Total Filed" value={stats.total} color={Colors.primary} />
                    <KPICard title="Pending" value={stats.pending} color={Colors.warning} />
                    <KPICard title="Resolved" value={stats.resolved} color={Colors.success} />
                </View>

                <View style={styles.actionSection}>
                    <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
                    <GovButton 
                        title="+ SUBMIT NEW GRIEVANCE" 
                        onPress={() => router.push('/(citizen)/submit-complaint')}
                        style={styles.actionBtn}
                    />
                    <GovButton 
                        title="VIEW MY COMPLAINTS" 
                        type="secondary"
                        onPress={() => router.push('/(citizen)/my-complaints')}
                        style={styles.actionBtn}
                    />
                    <GovButton 
                        title="LOGOUT" 
                        type="secondary"
                        onPress={handleLogout}
                        style={[styles.actionBtn, { backgroundColor: Colors.danger || '#f44336' }]}
                    />
                </View>

                <View style={styles.noticeBox}>
                    <Text style={styles.noticeTitle}>Official Notice:</Text>
                    <Text style={styles.noticeText}>
                        Grievances are addressed within 30 working days as per the Citizen Charter. 
                        False information is a punishable offense.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scroll: { padding: Spacing.lg },
    welcomeBox: { marginBottom: Spacing.xl },
    welcomeText: { fontSize: 16, color: Colors.grey[700] },
    userName: { fontSize: 24, fontWeight: '800', color: Colors.primaryDark },
    
    kpiRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
    
    actionSection: { marginBottom: Spacing.xl },
    sectionTitle: { fontSize: 12, fontWeight: '700', color: Colors.grey[400], letterSpacing: 1, marginBottom: Spacing.md },
    actionBtn: { marginBottom: Spacing.md },
    
    noticeBox: { 
        backgroundColor: '#fffbe6', 
        padding: Spacing.md, 
        borderRadius: Radius.sm, 
        borderLeftWidth: 4, borderLeftColor: Colors.warning 
    },
    noticeTitle: { fontSize: 14, fontWeight: '700', color: Colors.warning, marginBottom: 4 },
    noticeText: { fontSize: 12, color: Colors.grey[700], lineHeight: 18 },
});
