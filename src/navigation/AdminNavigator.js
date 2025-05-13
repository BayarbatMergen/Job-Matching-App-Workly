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
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminHome" component={AdminHomeScreen} />
      <Stack.Screen name="AdminJobList" component={AdminJobListScreen} />
      <Stack.Screen name="AdminJobDetail" component={AdminJobDetailScreen} />
      <Stack.Screen name="UserSelectionScreen" component={UserSelectionScreen} />
      <Stack.Screen name="AdminSchedule" component={AdminScheduleScreen} />
      <Stack.Screen name="SettlementApprovalScreen" component={SettlementApprovalScreen} options={{ headerTitle: '정산 승인 관리' }} />
      <Stack.Screen name="ApprovedApplicationsScreen" component={ApprovedApplicationsScreen} options={{ headerTitle: '승인 내역 보기' }} />
      <Stack.Screen name="AdminChat" component={AdminChatScreen} />
      <Stack.Screen name="ApprovalScreen" component={ApprovalScreen} />
      <Stack.Screen name="UserManagementScreen" component={UserManagementScreen} />
      <Stack.Screen name="UserDetailScreen" component={UserDetailScreen} />
      <Stack.Screen name="NoticeWriteScreen" component={NoticeWriteScreen} />
      <Stack.Screen name="CustomerInquiryScreen" component={CustomerInquiryScreen} />
      <Stack.Screen name="AdminPasswordChangeScreen" component={AdminPasswordChangeScreen} />
    </Stack.Navigator>
  );
}
