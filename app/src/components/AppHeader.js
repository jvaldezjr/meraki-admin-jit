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

  const displayName = user?.name || user?.email || null;
  const organization = user?.organization || user?.org || null;

  const headerContent = user ? (
    <Container style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999 }}>
      <Flex direction="vertical" gap="sm">
        <Text variant="body-md">Signed in as: {displayName || user.email}</Text>
        {organization && <Text variant="body-sm">{organization}</Text>}
        {user.email && <Text variant="caption" color="subdued">{user.email}</Text>}
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

  const profileHeading = loading ? 'Loading...' : (displayName || user?.email || 'Account');
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