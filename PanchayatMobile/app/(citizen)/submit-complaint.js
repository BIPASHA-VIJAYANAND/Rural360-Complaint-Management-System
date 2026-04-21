import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Alert, TouchableOpacity, Image } from 'react-native';
import { Colors, Spacing, Radius } from '../../constants/theme';
import { GovButton, GovInput } from '../../components/GovComponents';
import api from '../../src/api/axios';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

const CATEGORIES = [
  'Road & Infrastructure', 'Water Supply', 'Sanitation & Drainage', 
  'Electricity', 'Public Health', 'Education', 'Agriculture Support', 
  'Social Welfare', 'Revenue / Land Records', 'Other'
];

export default function SubmitComplaint() {
    const router = useRouter();
    const [form, setForm] = useState({ category: '', location: '', description: '', priority: 'Normal' });
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            return Alert.alert('Permission Denied', 'We need camera roll permissions to upload evidence.');
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.7,
        });

        if (!result.canceled) {
            const selected = result.assets.map(asset => ({
                uri: asset.uri,
                name: asset.fileName || `img_${Date.now()}.jpg`,
                type: 'image/jpeg'
            }));
            setImages([...images, ...selected].slice(0, 5));
        }
    };

    const handleUploadImages = async (complaintId) => {
        if (images.length === 0) return;

        const formData = new FormData();
        images.forEach((img) => {
            formData.append('images', {
                uri: img.uri,
                name: img.name,
                type: img.type,
            });
        });

        try {
            await api.post(`/complaints/${complaintId}/images`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
        } catch (error) {
            console.error('Image Upload Error:', error);
            Alert.alert('Caution', 'Grievance submitted, but some images failed to upload.');
        }
    };

    const handleSubmit = async () => {
        if (!form.category || !form.location || !form.description) {
            return Alert.alert('Mandatory Fields', 'Please fill in all the details.');
        }

        setLoading(true);
        try {
            // 1. Submit text data
            const res = await api.post('/complaints/', {
                category: form.category,
                location_text: form.location,
                description: form.description,
                priority: form.priority
            });

            // 2. Upload images if any
            if (images.length > 0) {
                await handleUploadImages(res.data.complaint_id);
            }

            Alert.alert('Success', `Grievance #${res.data.complaint_id} submitted successfully.`);
            router.replace('/(citizen)/dashboard');
        } catch (error) {
            const serverErrors = error.response?.data?.errors;
            let errorMsg = error.response?.data?.error || 'Failed to submit grievance.';
            
            if (serverErrors) {
                errorMsg = Object.entries(serverErrors)
                    .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
                    .join('\n');
            }
            
            Alert.alert('Submission Error', errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.headerBox}>
                    <Text style={styles.headerTitle}>Grievance Details</Text>
                    <Text style={styles.headerSub}>Complete all mandatory fields (*)</Text>
                </View>

                <View style={styles.formCard}>
                    {/* Category Selection */}
                    <Text style={styles.label}>Category*</Text>
                    <View style={styles.categoryContainer}>
                        {CATEGORIES.map(cat => (
                            <TouchableOpacity 
                                key={cat}
                                style={[styles.catItem, form.category === cat && styles.catItemActive]}
                                onPress={() => setForm({ ...form, category: cat })}
                            >
                                <Text style={[styles.catText, form.category === cat && styles.catTextActive]}>{cat}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <GovInput 
                        label="Location / Village / Ward*" 
                        placeholder="E.g. Ward No. 5, Near Market" 
                        value={form.location} 
                        onChangeText={t => setForm({ ...form, location: t })} 
                    />

                    <GovInput 
                        label="Grievance Description*" 
                        placeholder="Detailed description (min 20 chars)" 
                        value={form.description} 
                        onChangeText={t => setForm({ ...form, description: t })} 
                        multiline 
                        numberOfLines={4}
                    />

                    <Text style={styles.label}>Priority Level</Text>
                    <View style={styles.prioRow}>
                        {['Low', 'Normal', 'High', 'Urgent'].map(p => (
                            <TouchableOpacity 
                                key={p}
                                style={[styles.prioBtn, form.priority === p && styles.prioBtnActive]}
                                onPress={() => setForm({ ...form, priority: p })}
                            >
                                <Text style={[styles.prioText, form.priority === p && styles.prioTextActive]}>{p}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.evidenceBox}>
                        <Text style={styles.evidenceLabel}>Attach Evidence (Optional)</Text>
                        <Text style={styles.evidenceHint}>You can upload up to 5 photos.</Text>
                        
                        <View style={styles.imagePreviewRow}>
                            {images.map((img, i) => (
                                <View key={i} style={styles.imageWrap}>
                                    <Image source={{ uri: img.uri }} style={styles.previewImage} />
                                    <TouchableOpacity 
                                        style={styles.removeBadge} 
                                        onPress={() => setImages(images.filter((_, idx) => idx !== i))}
                                    >
                                        <Text style={styles.removeText}>×</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                            {images.length < 5 && (
                                <TouchableOpacity style={styles.addBtn} onPress={pickImage}>
                                    <Text style={styles.addPlus}>+</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    <GovButton 
                        title="SUBMIT GRIEVANCE" 
                        onPress={handleSubmit} 
                        loading={loading}
                        style={styles.submitBtn}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scroll: { padding: Spacing.lg },
    headerBox: { marginBottom: Spacing.lg },
    headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.primary },
    headerSub: { fontSize: 13, color: Colors.grey[400] },
    
    formCard: { 
        backgroundColor: Colors.white, 
        padding: Spacing.lg, 
        borderRadius: Radius.md, 
        borderWidth: 1, borderColor: Colors.grey[100] 
    },
    label: { fontSize: 13, fontWeight: '600', color: Colors.grey[700], marginBottom: 8 },
    
    categoryContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.md },
    catItem: { 
        paddingHorizontal: 12, paddingVertical: 8, 
        backgroundColor: Colors.grey[50], 
        borderRadius: Radius.xs, 
        borderWidth: 1, borderColor: Colors.grey[200] 
    },
    catItemActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    catText: { fontSize: 12, color: Colors.grey[700] },
    catTextActive: { color: Colors.white, fontWeight: '600' },
    
    prioRow: { flexDirection: 'row', gap: 6, marginBottom: Spacing.xl },
    prioBtn: { flex: 1, padding: 8, backgroundColor: Colors.grey[50], borderRadius: Radius.xs, alignItems: 'center', borderWidth: 1, borderColor: Colors.grey[100] },
    prioBtnActive: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
    prioText: { fontSize: 11, color: Colors.grey[700] },
    prioTextActive: { color: Colors.white, fontWeight: '700' },
    
    evidenceBox: { marginBottom: Spacing.xl, borderTopWidth: 1, borderTopColor: Colors.grey[50], paddingTop: Spacing.md },
    evidenceLabel: { fontSize: 13, fontWeight: '600', color: Colors.primary },
    evidenceHint: { fontSize: 11, color: Colors.grey[400], marginBottom: 12 },
    
    imagePreviewRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    imageWrap: { position: 'relative' },
    previewImage: { width: 60, height: 60, borderRadius: Radius.xs },
    removeBadge: { 
        position: 'absolute', top: -5, right: -5, 
        backgroundColor: Colors.danger, width: 18, height: 18, 
        borderRadius: 9, alignItems: 'center', justifyContent: 'center' 
    },
    removeText: { color: Colors.white, fontSize: 12, fontWeight: 'bold' },
    addBtn: { 
        width: 60, height: 60, 
        backgroundColor: Colors.grey[50], 
        borderRadius: Radius.xs, 
        borderWidth: 1, borderColor: Colors.grey[200], borderStyle: 'dashed',
        alignItems: 'center', justifyContent: 'center' 
    },
    addPlus: { fontSize: 24, color: Colors.grey[400] },
    
    submitBtn: { marginTop: Spacing.md },
});
