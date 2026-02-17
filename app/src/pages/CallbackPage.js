import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container } from '@magnetic/container';
import { Flex } from '@magnetic/flex';
import { Text } from '@magnetic/text';
import { Skeleton } from '@magnetic/skeleton';
import { useAuth } from '../contexts/AuthContext';

/**
 * CallbackPage - Handles the SAML SSO callback after authentication
 *
 * Backend redirects here with ?code=...&return_to=/. We exchange the one-time
 * code for a JWT (no cookies), store the token, then redirect to home.
 * Uses a ref to run the exchange only once (avoids double exchange under React Strict Mode).
 */
const CallbackPage = () => {
  const { setAuth, exchangeCodeForToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(null);
  const exchangedForCode = useRef(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const returnTo = searchParams.get('return_to');
    const path = returnTo && returnTo.startsWith('/') ? returnTo : '/';

    if (!code) {
      navigate('/login', { replace: true });
      return;
    }

    // Prevent double exchange when React Strict Mode runs the effect twice
    if (exchangedForCode.current === code) {
      return;
    }
    exchangedForCode.current = code;

    let cancelled = false;
    (async () => {
      try {
        const data = await exchangeCodeForToken(code);
        // Always apply auth and redirect on success. With Strict Mode, cleanup
        // runs before this resolves and sets cancelled=true; we must not skip.
        setAuth(data.access_token, data.user);
        navigate(path, { replace: true });
      } catch (err) {
        if (cancelled) return;
        console.error('Token exchange failed:', err);
        setError(err.message || 'Sign-in failed');
        navigate('/login', { replace: true, state: { error: err.message } });
      }
    })();
    return () => { cancelled = true; };
  }, [searchParams, setAuth, exchangeCodeForToken, navigate]);

  if (error) {
    return (
      <Container>
        <Flex direction="column" align="center" justify="center" style={{ minHeight: '100vh', padding: '24px' }}>
          <Text variant="body" color="subdued">{error}</Text>
        </Flex>
      </Container>
    );
  }

  return (
    <Container>
      <Flex
        direction="column"
        align="center"
        justify="center"
        gap="large"
        style={{ minHeight: '100vh', padding: '24px' }}
      >
        <Flex direction="column" align="center" gap="large" style={{ maxWidth: '400px' }}>
          <Skeleton height="40px" width="200px" />
          <Text variant="h3" align="center">
            Completing sign in...
          </Text>
          <Skeleton height="20px" width="300px" />
          <Skeleton height="20px" width="250px" />
        </Flex>
      </Flex>
    </Container>
  );
};

export default CallbackPage;
