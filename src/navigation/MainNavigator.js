import React, { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import AdminBottomTabNavigator from './AdminBottomTabNavigator';
import BottomTabNavigator from './BottomTabNavigator';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

const Stack = createNativeStackNavigator();

const MainNavigator = () => {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      try {
        const storedRole = await SecureStore.getItemAsync('userRole');
        
        setUserRole(storedRole);
      } catch (error) {
        console.error(' SecureStore 가져오기 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    checkRole();
  }, []);

  if (loading) {
    return null; // splash 제거 후 null 처리
  }

  if (userRole === 'admin') {
    return <AdminBottomTabNavigator />;
  } else if (userRole === 'user') {
    return <BottomTabNavigator />;
  } else {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
      </Stack.Navigator>
    );
  }
};

export default MainNavigator;
