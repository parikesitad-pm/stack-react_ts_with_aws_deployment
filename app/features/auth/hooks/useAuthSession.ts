import { useState, useEffect, useCallback } from "react";
import { AuthService } from "~/features/auth/services/auth.service";
import type { AuthUser, AuthSessionState } from "~/features/auth/types/auth.types";
import type { LoginInput } from "~/features/auth/schemas/login.schema";

export function useAuthSession() {
  const [state, setState] = useState<AuthSessionState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    error: null,
  });

  const checkSession = useCallback(async () => {
    try {
      const user = await AuthService.getCurrentSession();
      setState({
        isAuthenticated: Boolean(user),
        isLoading: false,
        user,
        error: null,
      });
    } catch {
      setState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: null,
      });
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = async (input: LoginInput) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const user = await AuthService.login(input);
      setState({
        isAuthenticated: true,
        isLoading: false,
        user,
        error: null,
      });
      return user;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      setState((prev) => ({ ...prev, isLoading: false, error: msg }));
      throw err;
    }
  };

  return {
    ...state,
    checkSession,
    login,
  };
}
