import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

//  관리자용 채팅 화면 Import
import AdminChatListScreen from '../screens/AdminChatListScreen';  //  새로 만든 채팅방 목록 파일
import AdminChatScreen from '../screens/AdminChatScreen';  // 기존 관리자 채팅 화면

const Stack = createStackNavigator();

export default function AdminChatStack() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerStyle: { backgroundColor: '#007AFF' },
        headerTintColor: '#fff',
        headerTitleAlign: 'center'
      }}
    >
      {/*  관리자용 채팅방 목록 (채팅방 리스트) */}
      <Stack.Screen 
        name="AdminChatList" 
        component={AdminChatListScreen} 
        options={{ headerTitle: '관리자 채팅방 목록' }} 
      />

      {/*  관리자용 채팅방 내부 (선택한 채팅방으로 이동) */}
      <Stack.Screen 
        name="AdminChatScreen" 
        component={AdminChatScreen} 
        options={({ route }) => ({ headerTitle: route.params?.roomName || '관리자 채팅' })} 
      />
    </Stack.Navigator>
  );
}
