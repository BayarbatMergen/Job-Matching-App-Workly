import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';
import ScheduleScreen from '../screens/ScheduleScreen';

const Stack = createStackNavigator();

export default function ScheduleNavigator() {
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#007AFF' },
        headerTintColor: '#fff',
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen
        name="ScheduleScreen"
        component={ScheduleScreen}
        options={{
          headerTitle: () => (
            <Text style={{ color: 'white', fontSize: 18 }}>
              {t('schedule.title')}
            </Text>
          ),
        }}
      />
    </Stack.Navigator>
  );
}
