// src/components/AppHeader.js
import { Header } from '@magnetic/header';
import { Container } from '@magnetic/container';
import { Flex } from '@magnetic/flex';
import { Text } from '@magnetic/text';
// import CiscoLogo from './CiscoLogo'; // If you're using a custom logo component

// Import styles specific to the header components
import '@magnetic/header/styles.css';
import '@magnetic/container/styles.css';
// import '@magnetic/flex/styles.css'; // Commented out due to export error, rely on manual style if needed
import '@magnetic/text/styles.css';
import '@magnetic/skeleton/styles.css';


const AppHeader = () => {
  // Define headerContent here, as it's part of this Header component
  const headerContent = (
    <Container style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999 }}>
      <Flex direction="vertical" gap="sm">
        <Text variant="body-md">Signed in as: Tier 1 Admin</Text>
        <Text variant="body-sm">ACME Corp, Inc</Text>
        <button style={{ marginTop: '10px', padding: '8px 12px', cursor: 'pointer' }}>Sign Out</button>
      </Flex>
    </Container>
  );

  return (
    <Header
      href="https://magnetic-react.cisco.com"
    //   logo={<Plus />} // Using the Plus icon for the logo
      productName="Meraki Admin JIT"
      profileAndTenant={{
        icon: "user",
        profile: {
          heading: "Tier 1 Admin",
          subHeading: "ACME Corp, Inc"
        },
        content: headerContent,
        tooltipLabel: "My profile"
      }}
    >
      <Header.Button icon="info" label="Info" onClick={() => console.log('Info button clicked')} />

    </Header>
  );
};

export default AppHeader;