import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, RefreshControl, Image } from 'react-native';
import { Colors, Spacing, Radius } from '../../../constants/theme';
import { StatusBadge } from '../../../components/GovComponents';
import api from '../../../src/api/axios';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TrackComplaint() {
    const params = useLocalSearchParams();
    const complaintId = params.complaintId;
    
    const [complaint, setComplaint] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    const getApiBase = () => {
        return api.defaults.baseURL.replace('/api', '');
    };

    const loadTrackingData = async () => {
        try {
            const res = await api.get(`/complaints/${complaintId}`);
            setComplaint(res.data);
        } catch (error) {
            console.error('Tracking Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadTrackingData();
        setRefreshing(false);
    };

    useEffect(() => { loadTrackingData(); }, []);

    if (loading && !refreshing) {
        return <View style={styles.center}><Text>Loading details...</Text></View>;
    }

    if (!complaint) {
        return <View style={styles.center}><Text>Grievance not found.</Text></View>;
    }

    const citizenImages = (complaint.images || []).filter(img => !img.file_name.startsWith('proof_'));
    const proofImages = (complaint.images || []).filter(img => img.file_name.startsWith('proof_'));

    const TimelineItem = ({ log, isLast }) => (
        <View style={styles.timelineItem}>
            <View style={styles.timelineLeading}>
                <View style={[styles.dot, log.new_status === 'Completed' && { backgroundColor: Colors.success }]} />
                {!isLast && <View style={styles.line} />}
            </View>
            <View style={styles.timelineBody}>
                <Text style={styles.logStatus}>{log.new_status}</Text>
                <Text style={styles.logBy}>By: {log.changed_by_name} • {new Date(log.changed_at).toLocaleDateString()}</Text>
                {log.remarks && <Text style={styles.logRemark}>"{log.remarks}"</Text>}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView 
                contentContainerStyle={styles.scroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View style={styles.infoCard}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.idLabel}>GRIEVANCE #{complaint.complaint_id}</Text>
                        <StatusBadge status={complaint.status} />
                    </View>
                    <Text style={styles.titleText}>{complaint.category}</Text>
                    <Text style={styles.subText}>{complaint.location_text}</Text>
                    
                    <View style={styles.separator} />
                    
                    <Text style={styles.descTitle}>Description:</Text>
                    <Text style={styles.descText}>{complaint.description}</Text>

                    {citizenImages.length > 0 && (
                        <View style={styles.imageSection}>
                            <Text style={styles.descTitle}>Citizen Evidence:</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizImgList}>
                                {citizenImages.map((img, i) => (
                                    <Image key={i} source={{ uri: `${getApiBase()}${img.url}` }} style={styles.thumb} />
                                ))}
                            </ScrollView>
                        </View>
                    )}
                </View>

                {proofImages.length > 0 && (
                    <View style={styles.proofCard}>
                        <View style={styles.proofHeader}>
                            <Ionicons name="checkmark-seal" size={20} color={Colors.success} />
                            <Text style={styles.proofTitle}>RESOLUTION PROOF</Text>
                        </View>
                        <Text style={styles.proofDesc}>Official photos confirming grievance resolution:</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizImgList}>
                            {proofImages.map((img, i) => (
                                <Image key={i} source={{ uri: `${getApiBase()}${img.url}` }} style={styles.thumb} />
                            ))}
                        </ScrollView>
                    </View>
                )}

                <View style={styles.trackSection}>
                    <Text style={styles.sectionTitle}>PROGRESS TIMELINE</Text>
                    <View style={styles.timelineContainer}>
                        {(complaint.history || []).map((log, idx) => (
                            <TimelineItem 
                                key={idx} 
                                log={log} 
                                isLast={idx === (complaint.history?.length || 0) - 1} 
                            />
                        ))}
                    </View>
                </View>

                {complaint.status === 'Completed' && (
                    <View style={styles.satisfactionBox}>
                        <Text style={styles.satTitle}>Grievance Resolved</Text>
                        <Text style={styles.satSub}>You can now close this grievance or provide feedback.</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scroll: { padding: Spacing.lg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    
    infoCard: { 
        backgroundColor: Colors.white, 
        padding: Spacing.lg, 
        borderRadius: Radius.md, 
        elevation: 1, marginBottom: Spacing.lg,
        borderWidth: 1, borderColor: Colors.grey[100]
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md, alignItems: 'center' },
    idLabel: { fontSize: 13, fontWeight: '700', color: Colors.primary, opacity: 0.7 },
    titleText: { fontSize: 22, fontWeight: '800', color: Colors.primaryDark },
    subText: { fontSize: 14, color: Colors.grey[700], marginTop: 4 },
    separator: { height: 1, backgroundColor: Colors.grey[100], marginVertical: Spacing.lg },
    descTitle: { fontSize: 12, fontWeight: '700', color: Colors.grey[400], marginBottom: 6, textTransform: 'uppercase' },
    descText: { fontSize: 15, color: Colors.grey[900], lineHeight: 24, marginBottom: Spacing.md },
    
    imageSection: { marginTop: Spacing.md },
    horizImgList: { flexDirection: 'row', marginTop: 8 },
    thumb: { width: 100, height: 100, borderRadius: Radius.sm, marginRight: 10, backgroundColor: Colors.grey[100] },

    proofCard: {
        backgroundColor: '#f6ffed',
        padding: Spacing.lg,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: '#b7eb8f',
        marginBottom: Spacing.lg
    },
    proofHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    proofTitle: { fontSize: 14, fontWeight: '800', color: Colors.success },
    proofDesc: { fontSize: 13, color: Colors.grey[700], marginBottom: 10 },
    
    trackSection: { marginTop: Spacing.sm },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.primary, letterSpacing: 1, marginBottom: Spacing.xl },
    
    timelineContainer: { paddingLeft: 10 },
    timelineItem: { flexDirection: 'row', gap: 15 },
    timelineLeading: { width: 20, alignItems: 'center' },
    dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.primary, zIndex: 1 },
    line: { width: 2, flex: 1, backgroundColor: Colors.grey[200], marginVertical: -4 },
    
    timelineBody: { flex: 1, paddingBottom: 30 },
    logStatus: { fontSize: 16, fontWeight: '700', color: Colors.primaryDark },
    logBy: { fontSize: 12, color: Colors.grey[400], marginTop: 2 },
    logRemark: { fontSize: 14, color: Colors.grey[700], fontStyle: 'italic', marginTop: 8, backgroundColor: '#f9f9f9', padding: 8, borderRadius: 4 },
    
    satisfactionBox: { 
        backgroundColor: Colors.primary, 
        padding: Spacing.lg, 
        borderRadius: Radius.md, alignItems: 'center',
        marginTop: Spacing.md
    },
    satTitle: { fontSize: 18, fontWeight: '800', color: Colors.white },
    satSub: { fontSize: 13, color: Colors.white, opacity: 0.9, marginTop: 6, textAlign: 'center' },
});
