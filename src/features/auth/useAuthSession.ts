import { useEffect, useState } from 'react';
import { supabaseConfigured } from '../../api/supabaseClient';
import { AppUser, getCurrentUser, signOut } from '../../api/supabaseAuth';

export function useAuthSession() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [authStatus, setAuthStatus] = useState<'loading' | 'ready'>(
    supabaseConfigured ? 'loading' : 'ready',
  );
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (!supabaseConfigured) return;
    getCurrentUser()
      .then(setUser)
      .catch((caught: unknown) => {
        setAuthError(caught instanceof Error ? caught.message : 'Không thể kiểm tra phiên đăng nhập.');
      })
      .finally(() => setAuthStatus('ready'));
  }, []);

  async function signOutCurrentUser() {
    try {
      await signOut();
      setUser(null);
    } catch (caught) {
      setAuthError(caught instanceof Error ? caught.message : 'Không thể đăng xuất.');
    }
  }

  return { user, setUser, authStatus, authError, signOutCurrentUser };
}
