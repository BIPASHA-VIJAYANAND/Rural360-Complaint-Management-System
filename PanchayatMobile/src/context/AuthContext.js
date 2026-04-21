import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                if (token) {
                    const decoded = jwtDecode(token);
                    setUser({ id: decoded.sub, role: decoded.role, full_name: decoded.full_name || 'Citizen' });
                }
            } catch (error) {
                console.log('Failed to parse token/AsyncStorage', error);
                await AsyncStorage.removeItem('token');
            } finally {
                setLoading(false);
            }
        };
        loadUser();
    }, []);

    const login = async (token) => {
        try {
            await AsyncStorage.setItem('token', token);
            const decoded = jwtDecode(token);
            setUser({ id: decoded.sub, role: decoded.role, full_name: decoded.full_name || 'Citizen' });
        } catch (error) {
            console.error('Login action failed:', error);
        }
    };

    const logout = async () => {
        await AsyncStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
