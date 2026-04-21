import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView } from 'react-native';
import api from '../src/api/axios';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '../constants/theme';
import { GovButton, GovInput } from '../components/GovComponents';

export default function Register() {
    const router = useRouter();

    const [form, setForm] = useState({ fullName: '', email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState('');

    const handleSendOTP = async () => {
        const cleanEmail = form.email.trim().toLowerCase();
        if (!cleanEmail) return Alert.alert('Error', 'Please enter your email to receive OTP.');
        setLoading(true);
        try {
            await api.post('/auth/send-otp', { email: cleanEmail });
            Alert.alert('Success', 'A 6-digit verification code has been sent to ' + cleanEmail);
            setOtpSent(true);
        } catch (e) {
            Alert.alert('Error', e.response?.data?.error || 'Failed to send OTP.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        if (!otp) return Alert.alert('Error', 'Please enter the verification code.');
        if (!form.fullName || !form.password) return Alert.alert('Error', 'Full name and password are required.');

        setLoading(true);
        try {
            await api.post('/auth/register', {
                full_name: form.fullName,
                email: form.email.trim().toLowerCase(),
                password: form.password,
                otp_code: otp
            });
            Alert.alert('Registration Successful', 'Your account has been created. Please sign in.');
            router.replace('/citizen-login');
        } catch (e) {
            Alert.alert('Registration Failed', e.response?.data?.error || 'Verification failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
                <ScrollView contentContainerStyle={styles.scroll}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>REGISTRATION</Text>
                        <View style={styles.saffronDot} />
                    </View>

                    <View style={styles.card}>
                        {!otpSent ? (
                            <>
                                <Text style={styles.cardInfo}>Verify your email to continue</Text>
                                <GovInput 
                                    label="Registered Email"
                                    placeholder="Enter your email" 
                                    value={form.email} 
                                    onChangeText={t => setForm({ ...form, email: t })} 
                                    keyboardType="email-address" 
                                    autoCapitalize="none" 
                                />
                                <GovButton 
                                    title="SEND VERIFICATION CODE" 
                                    onPress={handleSendOTP} 
                                    loading={loading}
                                    style={styles.mainBtn}
                                />
                            </>
                        ) : (
                            <>
                                <Text style={styles.cardInfo}>Verification code sent to {form.email}</Text>
                                <GovInput 
                                    label="Enter 6-Digit OTP"
                                    placeholder="000000" 
                                    value={otp} 
                                    onChangeText={setOtp} 
                                    keyboardType="numeric" 
                                    maxLength={6} 
                                />
                                <GovInput 
                                    label="Full Name (as per ID)"
                                    placeholder="John Doe" 
                                    value={form.fullName} 
                                    onChangeText={t => setForm({ ...form, fullName: t })} 
                                />
                                <GovInput 
                                    label="Create Password"
                                    placeholder="Minimum 6 characters" 
                                    value={form.password} 
                                    onChangeText={t => setForm({ ...form, password: t })} 
                                    secureTextEntry 
                                />
                                
                                <GovButton 
                                    title="COMPLETE REGISTRATION" 
                                    onPress={handleRegister} 
                                    loading={loading}
                                    style={styles.mainBtn}
                                />
                            </>
                        )}

                        <GovButton 
                            title="ALREADY REGISTERED? LOGIN" 
                            type="secondary"
                            onPress={() => router.push('/citizen-login')} 
                            style={styles.secBtn}
                        />

                        <GovButton 
                            title="BACK"
                            onPress={() => router.back()} 
                            style={styles.backBtn}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.background },
    container: { flex: 1 },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: Spacing.lg },
    header: { alignItems: 'center', marginBottom: Spacing.xl },
    headerTitle: { fontSize: 24, fontWeight: '800', color: Colors.primary, letterSpacing: 1.5 },
    saffronDot: { width: 30, height: 4, backgroundColor: Colors.secondary, marginTop: 4 },
    
    card: { 
        backgroundColor: Colors.white, 
        padding: Spacing.lg, 
        borderRadius: Radius.md, 
        borderWidth: 1, borderColor: Colors.grey[100],
        elevation: 4
    },
    cardInfo: { 
        fontSize: 14, color: Colors.grey[700], 
        textAlign: 'center', marginBottom: Spacing.lg,
        fontStyle: 'italic'
    },
    mainBtn: { marginTop: Spacing.md },
    secBtn: { marginTop: Spacing.xl, height: 45 },
    backBtn: { marginTop: Spacing.md, paddingVertical: 10, opacity: 0.7, backgroundColor: Colors.grey[700] },
});
