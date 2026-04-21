import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, RefreshControl, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Radius } from '../../constants/theme';
import { StatusBadge } from '../../components/GovComponents';
import api from '../../src/api/axios';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function MyComplaints() {
    const router = useRouter();
    const [complaints, setComplaints] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    const loadComplaints = async () => {
        try {
            const res = await api.get('/complaints/');
            setComplaints(res.data);
        } catch (error) {
            console.error('Failed to load complaints:', error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadComplaints();
        setRefreshing(false);
    };

    useEffect(() => { loadComplaints(); }, []);

    const renderItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.card} 
            onPress={() => router.push(`/(citizen)/track-complaint/${item.complaint_id}`)}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.complaintId}>ID: {item.complaint_id}</Text>
                <StatusBadge status={item.status} />
            </View>
            <Text style={styles.categoryText}>{item.category}</Text>
            <Text style={styles.locationText} numberOfLines={1}>{item.location_text}</Text>
            
            <View style={styles.cardFooter}>
                <Text style={styles.dateText}>Filed: {new Date(item.created_at).toLocaleDateString()}</Text>
                <Text style={styles.trackText}>DETAILS →</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <FlatList 
                data={complaints}
                renderItem={renderItem}
                keyExtractor={item => item.complaint_id.toString()}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="document-text-outline" size={60} color={Colors.grey[200]} />
                        <Text style={styles.emptyText}>No grievances filed yet.</Text>
                        <TouchableOpacity onPress={onRefresh}>
                            <Text style={styles.refreshText}>TAP TO REFRESH</Text>
                        </TouchableOpacity>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    list: { padding: Spacing.md },
    card: { 
        backgroundColor: Colors.white, 
        padding: Spacing.md, 
        borderRadius: Radius.md, 
        marginBottom: Spacing.md,
        borderWidth: 1, borderColor: Colors.grey[100],
        elevation: 2
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' },
    complaintId: { fontSize: 13, fontWeight: '700', color: Colors.primary },
    categoryText: { fontSize: 16, fontWeight: '700', color: Colors.primaryDark, marginBottom: 2 },
    locationText: { fontSize: 13, color: Colors.grey[700], marginBottom: Spacing.md },
    cardFooter: { 
        flexDirection: 'row', justifyContent: 'space-between', 
        borderTopWidth: 1, borderTopColor: Colors.grey[50],
        paddingTop: 8, marginTop: 4 
    },
    dateText: { fontSize: 11, color: Colors.grey[400] },
    trackText: { fontSize: 11, fontWeight: '800', color: Colors.secondary },
    
    empty: { marginTop: 100, alignItems: 'center' },
    emptyText: { fontSize: 16, color: Colors.grey[400], marginTop: 10 },
    refreshText: { fontSize: 12, fontWeight: '700', color: Colors.primary, marginTop: 10 },
});
