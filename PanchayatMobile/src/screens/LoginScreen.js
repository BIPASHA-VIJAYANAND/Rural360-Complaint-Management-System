import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function LoginScreen({ navigation }) {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            return Alert.alert('Input Required', 'Please fill in both email and password.');
        }
        
        setLoading(true);
        try {
            // Making API request to local Flask backend!
            const res = await api.post('/auth/login', { email, password, role: 'Citizen' });
            await login(res.data.token);
            // Optionally: navigation.navigate('Dashboard'); depending on your stack navigator
        } catch (error) {
            Alert.alert('Login Failed', error.response?.data?.error || 'Could not verify credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={styles.container}
        >
            <View style={styles.card}>
                <Text style={styles.header}>Panchayat Application</Text>
                <Text style={styles.subtext}>Citizen Services Portal</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Email Address"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
                    <Text style={styles.loginBtnText}>
                        {loading ? "Authenticating..." : "Login Securely"}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity style={{ marginTop: 20 }}>
                    <Text style={styles.linkText}>Register New Account</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#eef2f5',
        justifyContent: 'center',
        padding: 20,
    },
    card: {
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3, 
    },
    header: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#1e3a8a', // Deep Blue
        textAlign: 'center',
        marginBottom: 5,
    },
    subtext: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 30,
    },
    input: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        padding: 15,
        borderRadius: 8,
        fontSize: 16,
        marginBottom: 15,
    },
    loginBtn: {
        backgroundColor: '#f59e0b', // Amber/Orange Theme
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    loginBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    linkText: {
        color: '#1e3a8a',
        textAlign: 'center',
        fontWeight: '500',
    }
});
