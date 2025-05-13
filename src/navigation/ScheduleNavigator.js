import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ScheduleScreen from '../screens/ScheduleScreen';

const Stack = createStackNavigator();

export default function ScheduleNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#007AFF' }, // 상단 색상
        headerTintColor: '#fff', // 헤더 글씨 색상
        headerTitleAlign: 'center', // 중앙 정렬
      }}
    >
      <Stack.Screen 
        name="ScheduleScreen" 
        component={ScheduleScreen} 
        options={{ headerTitle: '일정 확인' }} 
      />
    </Stack.Navigator>
  );
}
