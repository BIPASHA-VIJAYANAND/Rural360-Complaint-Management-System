import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView } from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import api from '../src/api/axios';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '../constants/theme';
import { GovButton, GovInput } from '../components/GovComponents';

export default function AdminLogin() {
    const { login } = useAuth();
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) return Alert.alert('Input Required', 'Please fill in both fields.');
        setLoading(true);
        try {
            const cleanEmail = email.trim().toLowerCase();
            const res = await api.post('/auth/login', { email: cleanEmail, password: password.trim() });
            await login(res.data.token);
            router.replace('/(admin)/manage');
        } catch (error) {
            Alert.alert('Login Failed', error.response?.data?.error || 'Invalid credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
                <ScrollView contentContainerStyle={styles.scroll}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>OFFICIAL PORTAL</Text>
                        <Text style={styles.headerSub}>ADMIN & STAFF ACCESS</Text>
                        <View style={styles.saffronDot} />
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Personnel Sign In</Text>
                        
                        <GovInput 
                            label="Employee Email"
                            placeholder="staff@panchayat.gov.in"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        
                        <GovInput 
                            label="Secure Password"
                            placeholder="••••••••"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />

                        <GovButton 
                            title="SECURE LOGIN" 
                            onPress={handleLogin} 
                            loading={loading}
                            style={styles.loginBtn}
                        />

                        <GovButton 
                            title="BACK TO HOME"
                            type="secondary"
                            onPress={() => router.replace('/')} 
                            style={styles.backBtn}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.primaryDark },
    container: { flex: 1 },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: Spacing.lg },
    header: { alignItems: 'center', marginBottom: Spacing.xl },
    headerTitle: { fontSize: 24, fontWeight: '800', color: Colors.white, letterSpacing: 1.5 },
    headerSub: { fontSize: 12, color: Colors.grey[400], letterSpacing: 1, marginTop: 2 },
    saffronDot: { width: 40, height: 4, backgroundColor: Colors.secondary, marginTop: 8 },
    
    card: { 
        backgroundColor: Colors.white, 
        padding: Spacing.lg, 
        borderRadius: Radius.md, 
        elevation: 10
    },
    cardTitle: { 
        fontSize: 18, fontWeight: '700', 
        color: Colors.primaryDark, 
        marginBottom: Spacing.lg, 
        textAlign: 'center', 
        borderBottomWidth: 1, borderBottomColor: Colors.grey[100], 
        paddingBottom: 10 
    },
    loginBtn: { marginTop: Spacing.md },
    backBtn: { marginTop: Spacing.md, height: 45 },
});
