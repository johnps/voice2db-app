import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { LoginScreen } from '../screens/LoginScreen';
import { OTPScreen } from '../screens/OTPScreen';
import { BeneficiaryListScreen } from '../screens/BeneficiaryListScreen';
import { BeneficiaryProfileScreen } from '../screens/BeneficiaryProfileScreen';
import { RecordingScreen } from '../screens/RecordingScreen';
import { ExtractionScreen } from '../screens/ExtractionScreen';
import type { ExtractionResult } from '../modules/extraction/extractionSchema';

export type AuthStackParamList = {
  Login: undefined;
  OTP: { phone: string };
};

export type AppStackParamList = {
  BeneficiaryList: undefined;
  BeneficiaryProfile: { id: string };
  Recording: { beneficiaryId: string; beneficiaryName: string };
  Extraction: { beneficiaryId: string; transcript: string; audioUri: string };
  Confirmation: { beneficiaryId: string; transcript: string; audioUri: string; extractionResult: ExtractionResult };
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

export function RootNavigator() {
  const { session } = useAuth();

  return (
    <NavigationContainer>
      {session ? (
        <AppStack.Navigator>
          <AppStack.Screen name="BeneficiaryList" component={BeneficiaryListScreen} options={{ title: 'Beneficiaries' }} />
          <AppStack.Screen name="BeneficiaryProfile" component={BeneficiaryProfileScreen} options={{ title: 'Profile' }} />
          <AppStack.Screen name="Recording" component={RecordingScreen} options={{ title: 'Record' }} />
          <AppStack.Screen name="Extraction" component={ExtractionScreen} options={{ title: 'Review Data' }} />
          <AppStack.Screen name="Confirmation" component={() => null} options={{ title: 'Confirm' }} />
        </AppStack.Navigator>
      ) : (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Login" component={LoginScreen} />
          <AuthStack.Screen name="OTP" component={OTPScreen} />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
}
