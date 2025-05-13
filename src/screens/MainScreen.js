import React, { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import AdminBottomTabNavigator from '../navigation/AdminBottomTabNavigator';
import BottomTabNavigator from '../navigation/BottomTabNavigator';
import LoginScreen from './LoginScreen';
import RegisterScreen from './RegisterScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

const MainScreen = () => {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRole = async () => {
      const storedRole = await SecureStore.getItemAsync('userRole');
      
      setRole(storedRole);
      setLoading(false);
    };
    loadRole();
  }, []);

  if (loading) return null; // splash 없앴으니까 null 처리

  if (role === 'admin') return <AdminBottomTabNavigator />;
  if (role === 'user') return <BottomTabNavigator />;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
};

export default MainScreen;
