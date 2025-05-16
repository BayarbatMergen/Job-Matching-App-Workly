import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AdminHomeScreen from '../screens/AdminHomeScreen';
import AdminJobListScreen from '../screens/AdminJobListScreen';
import AdminJobDetailScreen from '../screens/AdminJobDetailScreen';
import AdminScheduleScreen from '../screens/AdminScheduleScreen';
import AdminChatScreen from '../screens/AdminChatScreen';
import ApprovalScreen from '../screens/ApprovalScreen';
import UserManagementScreen from '../screens/UserManagementScreen';
import UserDetailScreen from '../screens/UserDetailScreen';
import NoticeWriteScreen from '../screens/NoticeWriteScreen';
import CustomerInquiryScreen from '../screens/CustomerInquiryScreen';
import AdminPasswordChangeScreen from '../screens/AdminPasswordChangeScreen';
import UserSelectionScreen from '../screens/UserSelectionScreen';
import SettlementApprovalScreen from '../screens/SettlementApprovalScreen';
import ApprovedApplicationsScreen from '../screens/ApprovedApplicationsScreen';

const Stack = createStackNavigator();

export default function AdminNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#007AFF' },
        headerTintColor: '#fff',
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen name="AdminHome" component={AdminHomeScreen} options={{ headerTitle: '관리자 홈' }} />
      <Stack.Screen name="AdminJobList" component={AdminJobListScreen} options={{ headerTitle: '공고 목록' }} />
      <Stack.Screen name="AdminJobDetail" component={AdminJobDetailScreen} options={{ headerTitle: '공고 상세' }} />
      <Stack.Screen name="UserSelectionScreen" component={UserSelectionScreen} options={{ headerTitle: '사용자 선택' }} />
      <Stack.Screen name="AdminSchedule" component={AdminScheduleScreen} options={{ headerTitle: '일정 관리' }} />
      <Stack.Screen
        name="SettlementApprovalScreen"
        component={SettlementApprovalScreen}
        options={{
          headerTitle: '정산 승인 요청',
        }}
      />
      <Stack.Screen
        name="ApprovedApplicationsScreen"
        component={ApprovedApplicationsScreen}
        options={{ headerTitle: '승인 내역 보기' }}
      />
      <Stack.Screen name="AdminChat" component={AdminChatScreen} options={{ headerTitle: '채팅 관리' }} />
      <Stack.Screen name="ApprovalScreen" component={ApprovalScreen} options={{ headerTitle: '지원자 승인' }} />
      <Stack.Screen name="UserManagementScreen" component={UserManagementScreen} options={{ headerTitle: '사용자 관리' }} />
      <Stack.Screen name="UserDetailScreen" component={UserDetailScreen} options={{ headerTitle: '사용자 상세' }} />
      <Stack.Screen name="NoticeWriteScreen" component={NoticeWriteScreen} options={{ headerTitle: '공지 작성' }} />
      <Stack.Screen name="CustomerInquiryScreen" component={CustomerInquiryScreen} options={{ headerTitle: '문의 관리' }} />
      <Stack.Screen name="AdminPasswordChangeScreen" component={AdminPasswordChangeScreen} options={{ headerTitle: '비밀번호 변경' }} />
    </Stack.Navigator>
  );
}
