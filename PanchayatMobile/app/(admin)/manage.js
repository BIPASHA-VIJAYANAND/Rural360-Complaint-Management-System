import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, RefreshControl, Modal, TouchableOpacity, Alert, Image, ScrollView } from 'react-native';
import { Colors, Spacing, Radius } from '../../constants/theme';
import { StatusBadge, GovButton, GovInput } from '../../components/GovComponents';
import api from '../../src/api/axios';
import { useAuth } from '../../src/context/AuthContext';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

export default function AdminManage() {
    const { logout } = useAuth();
    const router = useRouter();
    const [complaints, setComplaints] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    
    // Modal states
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [newStatus, setNewStatus] = useState('');
    const [remarks, setRemarks] = useState('');
    const [proofImages, setProofImages] = useState([]);
    const [updating, setUpdating] = useState(false);

    const getApiBase = () => {
        return api.defaults.baseURL.replace('/api', '');
    };

    const loadAll = async () => {
        try {
            const res = await api.get('/complaints/');
            setComplaints(res.data);
        } catch (error) {
            console.error('Admin Load Error:', error);
        }
    };

    const fetchDetails = async (id) => {
        try {
            const res = await api.get(`/complaints/${id}`);
            setSelectedComplaint(res.data);
            setNewStatus(res.data.status);
            setModalVisible(true);
        } catch (error) {
            Alert.alert('Error', 'Failed to fetch grievance details.');
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadAll();
        setRefreshing(false);
    };

    const pickProof = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return Alert.alert('Denied', 'Permission needed.');

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.5,
        });

        if (!result.canceled) {
            const selected = result.assets.map(asset => ({
                uri: asset.uri,
                name: `proof_${Date.now()}_${asset.fileName || 'img.jpg'}`,
                type: 'image/jpeg'
            }));
            setProofImages([...proofImages, ...selected]);
        }
    };

    const handleUpdate = async () => {
        if (!newStatus) return Alert.alert('Error', 'Select a status.');
        setUpdating(true);
        try {
            // 1. Update Status
            await api.patch(`/complaints/${selectedComplaint.complaint_id}/status`, { 
                new_status: newStatus, 
                remarks: remarks 
            });

            // 2. Upload Proof if Completed
            if (newStatus === 'Completed' && proofImages.length > 0) {
                const formData = new FormData();
                proofImages.forEach(img => {
                    formData.append('images', {
                        uri: img.uri,
                        name: img.name,
                        type: img.type
                    });
                });
                await api.post(`/complaints/${selectedComplaint.complaint_id}/images`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            Alert.alert('Success', 'Grievance updated successfully.');
            setModalVisible(false);
            setProofImages([]);
            setRemarks('');
            onRefresh();
        } catch (error) {
            Alert.alert('Update Failed', error.response?.data?.error || 'Server error.');
        } finally {
            setUpdating(false);
        }
    };

    useEffect(() => { loadAll(); }, []);

    const renderItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.card} 
            onPress={() => fetchDetails(item.complaint_id)}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.complaintId}>ID: {item.complaint_id}</Text>
                <StatusBadge status={item.status} />
            </View>
            <Text style={styles.categoryText}>{item.category}</Text>
            <Text style={styles.citizenText}>Reported By: {item.citizen_name}</Text>
            <Text style={styles.locationText} numberOfLines={1}>{item.location_text}</Text>
            
            <View style={styles.cardFooter}>
                <Text style={styles.dateText}>Filed on {new Date(item.created_at).toLocaleDateString()}</Text>
                <Text style={styles.actionText}>REVIEW DETAILS →</Text>
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
                ListFooterComponent={
                    <View style={{ padding: Spacing.md }}>
                        <GovButton 
                            title="LOGOUT SESSION" 
                            type="secondary"
                            onPress={async () => { await logout(); router.replace('/'); }}
                            style={{ backgroundColor: Colors.danger || '#f44336' }}
                        />
                    </View>
                }
            />

            <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                            <Ionicons name="close" size={28} color={Colors.primary} />
                        </TouchableOpacity>
                        <Text style={styles.modalHeaderTitle}>Manage Grievance</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <ScrollView contentContainerStyle={styles.modalScroll}>
                        {selectedComplaint && (
                            <View style={styles.detailBox}>
                                <View style={styles.detailRow}>
                                    <View>
                                        <Text style={styles.detailId}>#{selectedComplaint.complaint_id}</Text>
                                        <Text style={styles.detailCat}>{selectedComplaint.category}</Text>
                                    </View>
                                    <StatusBadge status={selectedComplaint.status} />
                                </View>
                                
                                <Text style={styles.detailLabel}>CITIZEN DETAILS</Text>
                                <Text style={styles.detailVal}>{selectedComplaint.citizen_name} ({selectedComplaint.citizen_phone})</Text>
                                <Text style={styles.detailVal}>{selectedComplaint.location_text}</Text>

                                <Text style={styles.detailLabel}>DESCRIPTION</Text>
                                <Text style={styles.detailDesc}>{selectedComplaint.description}</Text>

                                {selectedComplaint.images && selectedComplaint.images.length > 0 && (
                                    <View style={styles.evidenceSection}>
                                        <Text style={styles.detailLabel}>CITIZEN EVIDENCE</Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.evidenceRow}>
                                            {selectedComplaint.images.map((img, i) => (
                                                <Image key={i} source={{ uri: `${getApiBase()}${img.url}` }} style={styles.evidenceThumb} />
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}
                            </View>
                        )}

                        <View style={styles.updateForm}>
                            <Text style={styles.detailLabel}>TRANSITION STATUS</Text>
                            <View style={styles.statusChips}>
                                {['Under Review', 'Approved', 'Assigned', 'In Progress', 'Completed', 'Closed'].map(s => (
                                    <TouchableOpacity 
                                        key={s} 
                                        style={[styles.statusChip, newStatus === s && styles.statusChipActive]}
                                        onPress={() => setNewStatus(s)}
                                    >
                                        <Text style={[styles.statusChipText, newStatus === s && styles.statusChipTextActive]}>{s}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <GovInput 
                                label="Action Taken / Internal Remarks" 
                                placeholder="Describe work done or status reason..." 
                                value={remarks} 
                                onChangeText={setRemarks}
                                multiline
                            />

                            {newStatus === 'Completed' && (
                                <View style={styles.proofSection}>
                                    <Text style={styles.detailLabel}>RESOLUTION PROOF (Required for completion)</Text>
                                    <View style={styles.proofPickerRow}>
                                        {proofImages.map((img, i) => (
                                            <Image key={i} source={{ uri: img.uri }} style={styles.evidenceThumb} />
                                        ))}
                                        <TouchableOpacity style={styles.addProofBtn} onPress={pickProof}>
                                            <Ionicons name="camera" size={30} color={Colors.grey[400]} />
                                            <Text style={styles.proofBtnText}>Add Photos</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}

                            <GovButton 
                                title="SAVE CHANGES" 
                                onPress={handleUpdate} 
                                loading={updating}
                                style={styles.saveBtn}
                            />
                        </View>
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    list: { padding: Spacing.md },
    card: { 
        backgroundColor: Colors.white, 
        padding: Spacing.md, borderRadius: Radius.md, 
        marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.grey[100] 
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    complaintId: { fontSize: 13, fontWeight: '700', color: Colors.primary },
    categoryText: { fontSize: 16, fontWeight: '700', color: Colors.primaryDark },
    citizenText: { fontSize: 12, color: Colors.grey[400], marginTop: 2 },
    locationText: { fontSize: 13, color: Colors.grey[700], marginTop: 4 },
    cardFooter: { 
        flexDirection: 'row', justifyContent: 'space-between', 
        borderTopWidth: 1, borderTopColor: Colors.grey[50], 
        paddingTop: 8, marginTop: Spacing.md 
    },
    dateText: { fontSize: 11, color: Colors.grey[400] },
    actionText: { fontSize: 11, fontWeight: '800', color: Colors.secondary },
    
    // Modal
    modalContainer: { flex: 1, backgroundColor: Colors.white },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.grey[100] },
    closeBtn: { padding: 5 },
    modalHeaderTitle: { fontSize: 18, fontWeight: '800', color: Colors.primary },
    modalScroll: { padding: Spacing.lg },
    
    detailBox: { marginBottom: Spacing.xl },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md },
    detailId: { fontSize: 14, color: Colors.grey[400], fontWeight: '600' },
    detailCat: { fontSize: 24, fontWeight: '800', color: Colors.primaryDark },
    detailLabel: { fontSize: 12, fontWeight: '800', color: Colors.primary, letterSpacing: 0.5, marginTop: 15, marginBottom: 5 },
    detailVal: { fontSize: 14, color: Colors.grey[900] },
    detailDesc: { fontSize: 15, color: Colors.grey[700], lineHeight: 22, marginTop: 5 },
    
    evidenceSection: { marginTop: 10 },
    evidenceRow: { flexDirection: 'row', marginTop: 10 },
    evidenceThumb: { width: 80, height: 80, borderRadius: Radius.sm, marginRight: 10, backgroundColor: Colors.grey[50] },
    
    updateForm: { borderTopWidth: 8, borderTopColor: Colors.background, marginHorizontal: -Spacing.lg, padding: Spacing.lg },
    statusChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 10 },
    statusChip: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: Colors.grey[50], borderRadius: Radius.xs, borderWidth: 1, borderColor: Colors.grey[200] },
    statusChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    statusChipText: { fontSize: 12, color: Colors.grey[700] },
    statusChipTextActive: { color: Colors.white, fontWeight: '700' },
    
    proofSection: { marginVertical: 15 },
    proofPickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
    addProofBtn: { width: 80, height: 80, borderRadius: Radius.sm, borderStyle: 'dashed', borderWidth: 2, borderColor: Colors.grey[200], alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.grey[50] },
    proofBtnText: { fontSize: 10, color: Colors.grey[400], fontWeight: '700', marginTop: 2 },
    saveBtn: { marginTop: Spacing.lg },
});
