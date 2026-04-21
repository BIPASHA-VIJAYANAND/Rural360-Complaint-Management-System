import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * API CONFIGURATION
 * Emulator: 'http://10.0.2.2:5000/api'
 * Physical Device: 'http://<YOUR_LAN_IP>:5000/api'
 */
const BASE_URL = 'http://172.20.10.5:5000/api'; // <--- Update this to your LAN IP

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
});

// Request interceptor for Auth
api.interceptors.request.use(async (config) => {
    try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        console.log(`[API Request]: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    } catch (e) {
        console.error('[API Interceptor Error]:', e);
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;
