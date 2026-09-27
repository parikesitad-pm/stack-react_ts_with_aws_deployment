import React from 'react';
import { Auth0Provider } from '@auth0/auth0-react';
import { useNavigate } from 'react-router';
import { getAuth0Config } from '../services/auth0.service';

interface StackAuthProviderProps {
  children: React.ReactNode;
}

export function StackAuthProvider({ children }: StackAuthProviderProps) {
  const navigate = useNavigate();
  const config = getAuth0Config();

  const handleRedirectCallback = (appState?: { returnTo?: string }) => {
    const returnTo = appState?.returnTo || '/app';
    navigate(returnTo, { replace: true });
  };

  return (
    <Auth0Provider
      domain={config.domain}
      clientId={config.clientId}
      authorizationParams={{
        redirect_uri: config.redirectUri,
        audience: config.audience,
        scope: 'openid profile email',
      }}
      onRedirectCallback={handleRedirectCallback}
      useRefreshTokens={true}
      cacheLocation="localstorage"
    >
      {children}
    </Auth0Provider>
  );
}
