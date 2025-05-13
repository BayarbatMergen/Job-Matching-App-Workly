import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ChatListScreen from '../screens/ChatListScreen'; //  채팅 목록
import ChatScreen from '../screens/ChatScreen'; //  개별 채팅방

const Stack = createStackNavigator();

export default function ChatNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#007AFF' },
        headerTintColor: '#fff',
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen name="ChatList" component={ChatListScreen} options={{ headerTitle: '채팅방 목록' }} />
      <Stack.Screen
        name="ChatScreen"
        component={ChatScreen}
        options={({ route }) => ({ headerTitle: route.params?.roomName || '채팅방' })}
      />
    </Stack.Navigator>
  );
}
