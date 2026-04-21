import { Tabs } from 'expo-router';
import { Colors } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function CitizenLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: Colors.primary,
      tabBarInactiveTintColor: Colors.grey[400],
      headerStyle: { backgroundColor: Colors.primary, borderBottomWidth: 4, borderBottomColor: Colors.secondary },
      headerTintColor: Colors.white,
      headerTitleStyle: { fontWeight: 'bold' },
    }}>
      <Tabs.Screen 
        name="dashboard" 
        options={{ 
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="my-complaints" 
        options={{ 
          title: 'My Complaints',
          tabBarIcon: ({ color, size }) => <Ionicons name="list" size={size} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="submit-complaint" 
        options={{ 
          title: 'Submit',
          tabBarIcon: ({ color, size }) => <Ionicons name="add-circle" size={size} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="track-complaint/[complaintId]" 
        options={{ 
          title: 'Track',
          tabBarIcon: ({ color, size }) => <Ionicons name="map" size={size} color={color} />,
          href: null,
        }} 
      />
    </Tabs>
  );
}
