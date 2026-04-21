import { Tabs } from 'expo-router';
import { Colors } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function AdminLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: Colors.secondary,
      tabBarInactiveTintColor: Colors.grey[400],
      headerStyle: { backgroundColor: Colors.primaryDark, borderBottomWidth: 4, borderBottomColor: Colors.secondary },
      headerTintColor: Colors.white,
      headerTitleStyle: { fontWeight: 'bold' },
    }}>
      <Tabs.Screen 
        name="manage" 
        options={{ 
          title: 'Grievances',
          tabBarIcon: ({ color, size }) => <Ionicons name="documents" size={size} color={color} />
        }} 
      />
    </Tabs>
  );
}
