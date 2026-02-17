// src/components/AppHeader.js
import { Header } from '@magnetic/header';
import { Container } from '@magnetic/container';
import { Flex } from '@magnetic/flex';
import { Text } from '@magnetic/text';
import { Button } from '@magnetic/button';
import { useAuth } from '../contexts/AuthContext';
// import CiscoLogo from './CiscoLogo'; // If you're using a custom logo component

// Import styles specific to the header components
import '@magnetic/header/styles.css';
import '@magnetic/container/styles.css';
// import '@magnetic/flex/styles.css'; // Commented out due to export error, rely on manual style if needed
import '@magnetic/text/styles.css';
import '@magnetic/skeleton/styles.css';


const AppHeader = () => {
  const { user, loading, logout } = useAuth();

  // Display name (full name from IdP): used in dropdown
  const displayName = user?.name || user?.email || null;
  // First name: shown in header bar when present
  const firstName = user?.first_name || null;
  const organization = user?.organization || user?.org || null;

  const headerContent = user ? (
    <Container style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999 }}>
      <Flex direction="vertical" gap="sm">
        {displayName && <Text variant="body-md">{displayName}</Text>}
        {user.email && <Text variant="caption" color="subdued">{user.email}</Text>}
        {organization && <Text variant="body-sm">{organization}</Text>}
        <Button
          kind="secondary"
          size="small"
          onClick={logout}
          style={{ marginTop: '10px' }}
        >
          Sign Out
        </Button>
      </Flex>
    </Container>
  ) : null;

  // Header bar: first name, then display name, then email (configure Duo to send givenName/displayName)
  const profileHeading = loading
    ? 'Loading...'
    : (firstName || displayName || user?.email || 'Account');
  const profileSubHeading = loading ? '' : (organization || '');

  return (
    <Header
      href="/"
      productName="Meraki Admin JIT"
      profileAndTenant={{
        icon: "user",
        profile: {
          heading: profileHeading,
          subHeading: profileSubHeading
        },
        content: headerContent,
        tooltipLabel: "My profile"
      }}
    >
      <Header.Button 
        icon="info" 
        label="Info" 
        onClick={() => console.log('Info button clicked')} 
      />
    </Header>
  );
};

export default AppHeader;