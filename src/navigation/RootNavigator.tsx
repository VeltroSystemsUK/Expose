import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList, TabParamList } from '../types';
import { colors, typography, spacing } from '../theme';

import HomeScreen from '../screens/HomeScreen';
import ScannerScreen from '../screens/ScannerScreen';
import CalculatorScreen from '../screens/CalculatorScreen';
import AnalysingScreen from '../screens/AnalysingScreen';
import ResultsScreen from '../screens/ResultsScreen';
import LeadStep1Screen from '../screens/leadgen/LeadStep1Screen';
import LeadStep2Screen from '../screens/leadgen/LeadStep2Screen';
import LeadStep3Screen from '../screens/leadgen/LeadStep3Screen';
import LeadSuccessScreen from '../screens/leadgen/LeadSuccessScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
      {label}
    </Text>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textDim,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
          ),
          tabBarLabel: ({ focused }) => <TabLabel label="HOME" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'scan' : 'scan-outline'} size={22} color={color} />
          ),
          tabBarLabel: ({ focused }) => <TabLabel label="SCANNER" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Calculator"
        component={CalculatorScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'calculator' : 'calculator-outline'} size={22} color={color} />
          ),
          tabBarLabel: ({ focused }) => <TabLabel label="CALCULATOR" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.black } }}>
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen name="Analysing" component={AnalysingScreen} />
      <Stack.Screen name="Results" component={ResultsScreen} />
      <Stack.Screen name="LeadStep1" component={LeadStep1Screen} />
      <Stack.Screen name="LeadStep2" component={LeadStep2Screen} />
      <Stack.Screen name="LeadStep3" component={LeadStep3Screen} />
      <Stack.Screen name="LeadSuccess" component={LeadSuccessScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 64,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: typography.xs,
    fontWeight: typography.medium,
    letterSpacing: 0.8,
    color: colors.textDim,
  },
  tabLabelActive: {
    color: colors.accent,
  },
});
