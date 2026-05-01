import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { RootNavigator } from './RootNavigator';
import { AuthContext } from '../context/AuthContext';
import type { Session } from '@supabase/supabase-js';

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({ children }: any) => children,
    Screen: ({ name, component: Component }: any) => <Component key={name} />,
  }),
}));

jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: any) => children,
}));

jest.mock('../screens/LoginScreen', () => ({
  LoginScreen: () => {
    const { Text } = require('react-native');
    return <Text>Login</Text>;
  },
}));

jest.mock('../screens/OTPScreen', () => ({
  OTPScreen: () => {
    const { Text } = require('react-native');
    return <Text>OTP</Text>;
  },
}));

jest.mock('../screens/BeneficiaryListScreen', () => ({
  BeneficiaryListScreen: () => {
    const { Text } = require('react-native');
    return <Text>Beneficiary List</Text>;
  },
}));

jest.mock('../screens/BeneficiaryProfileScreen', () => ({
  BeneficiaryProfileScreen: () => {
    const { Text } = require('react-native');
    return <Text>Beneficiary Profile</Text>;
  },
}));

jest.mock('../screens/RecordingScreen', () => ({
  RecordingScreen: () => {
    const { Text } = require('react-native');
    return <Text>Recording</Text>;
  },
}));

const renderWithSession = (session: Session | null) =>
  render(
    <AuthContext.Provider value={{ session, loading: false }}>
      <RootNavigator />
    </AuthContext.Provider>
  );

describe('RootNavigator', () => {
  it('shows the login screen when there is no session', async () => {
    renderWithSession(null);
    await waitFor(() => expect(screen.getByText('Login')).toBeTruthy());
  });

  it('shows the app screen when a session exists', async () => {
    const fakeSession = { user: { id: 'worker-1' } } as Session;
    renderWithSession(fakeSession);
    await waitFor(() => expect(screen.getByText('Beneficiary List')).toBeTruthy());
  });
});
