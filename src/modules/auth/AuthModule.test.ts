import { createAuthModule } from './AuthModule';

const mockSignInWithOtp = jest.fn();
const mockVerifyOtp = jest.fn();
const mockGetSession = jest.fn();
const mockSignOut = jest.fn();

const mockSupabase = {
  auth: {
    signInWithOtp: mockSignInWithOtp,
    verifyOtp: mockVerifyOtp,
    getSession: mockGetSession,
    signOut: mockSignOut,
  },
} as any;

beforeEach(() => jest.clearAllMocks());

describe('AuthModule', () => {
  describe('signIn', () => {
    it('sends OTP to the provided phone number', async () => {
      mockSignInWithOtp.mockResolvedValue({ error: null });
      const auth = createAuthModule(mockSupabase);

      await auth.signIn('+911234567890');

      expect(mockSignInWithOtp).toHaveBeenCalledWith({ phone: '+911234567890' });
    });

    it('throws when Supabase returns an error', async () => {
      mockSignInWithOtp.mockResolvedValue({ error: { message: 'Invalid phone' } });
      const auth = createAuthModule(mockSupabase);

      await expect(auth.signIn('bad-phone')).rejects.toThrow('Invalid phone');
    });
  });

  describe('verifyOTP', () => {
    it('verifies the OTP token for the given phone number', async () => {
      mockVerifyOtp.mockResolvedValue({ data: { session: { user: {} } }, error: null });
      const auth = createAuthModule(mockSupabase);

      await auth.verifyOTP('+911234567890', '123456');

      expect(mockVerifyOtp).toHaveBeenCalledWith({
        phone: '+911234567890',
        token: '123456',
        type: 'sms',
      });
    });

    it('throws when the OTP token is invalid', async () => {
      mockVerifyOtp.mockResolvedValue({ data: { session: null }, error: { message: 'Token expired' } });
      const auth = createAuthModule(mockSupabase);

      await expect(auth.verifyOTP('+911234567890', 'wrong')).rejects.toThrow('Token expired');
    });
  });

  describe('getSession', () => {
    it('returns null when no session exists', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
      const auth = createAuthModule(mockSupabase);

      const session = await auth.getSession();

      expect(session).toBeNull();
    });

    it('returns the session when one exists', async () => {
      const fakeSession = { user: { id: 'worker-1' }, access_token: 'tok' };
      mockGetSession.mockResolvedValue({ data: { session: fakeSession }, error: null });
      const auth = createAuthModule(mockSupabase);

      const session = await auth.getSession();

      expect(session).toEqual(fakeSession);
    });
  });

  describe('signOut', () => {
    it('calls Supabase signOut', async () => {
      mockSignOut.mockResolvedValue({ error: null });
      const auth = createAuthModule(mockSupabase);

      await auth.signOut();

      expect(mockSignOut).toHaveBeenCalled();
    });

    it('throws when Supabase returns an error', async () => {
      mockSignOut.mockResolvedValue({ error: { message: 'Sign out failed' } });
      const auth = createAuthModule(mockSupabase);

      await expect(auth.signOut()).rejects.toThrow('Sign out failed');
    });
  });
});
