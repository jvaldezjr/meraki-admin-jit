import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container } from '@magnetic/container';
import { Flex } from '@magnetic/flex';
import { Text } from '@magnetic/text';
import { Button } from '@magnetic/button';
import { useAuth } from '../contexts/AuthContext';
import './LoginPage.css';

const LoginPage = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleLogin = () => {
    login();
  };

  return (
    <div
      className="login-page"
      style={{
        minHeight: '100vh',
        background: 'var(--base-bg-default, #f2f5fa)',
        boxSizing: 'border-box',
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div className="login-page-content">
        <div className="login-card">
          <Flex direction="vertical" gap={24} style={{ width: '100%' }}>
            {/* Header block */}
            <Flex direction="vertical" align="center" gap={8}>
              <Text variant="h1" align="center">
                Meraki Admin JIT
              </Text>
              <Text variant="h3" align="center" color="subdued">
                Just-in-Time Admin Access
              </Text>
            </Flex>

            <Text
              variant="body"
              align="center"
              color="subdued"
              style={{ maxWidth: 360, margin: '0 auto' }}
            >
              Secure access management for Meraki Dashboard administrators with
              time-limited privilege escalation.
            </Text>

            <div className="login-card-divider" aria-hidden="true" />

            {/* Sign-in block – button matches HomePage (md, generous padding) */}
            <Flex direction="vertical" align="center" gap={12}>
              <Button
                kind="primary"
                onClick={handleLogin}
                className="login-button"
              >
                Sign In with Duo SSO
              </Button>
            <Text variant="caption" align="center" color="subdued">
              Sign in using your organization&apos;s Duo Single Sign-On
            </Text>
          </Flex>

          {/* Footer */}
          <Flex
            direction="vertical"
            align="center"
            gap={4}
            style={{ marginTop: 8 }}
          >
            <Text variant="caption" align="center" color="subdued">
              Secured with SAML 2.0 and Duo MFA
            </Text>
          </Flex>
        </Flex>
      </div>
      </div>
    </div>
  );
};

export default LoginPage;
