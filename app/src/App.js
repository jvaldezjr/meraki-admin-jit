import React from 'react';
import { Button } from '@magnetic/button';
// Import the official Magnetic Header and its sub-components
import { Header } from '@magnetic/header';
import { Container } from '@magnetic/container';
import { Flex } from '@magnetic/flex'; // Already installed
import { Text } from '@magnetic/text'; // Already installed
// import CiscoLogo from './CiscoLogo'; // Import your placeholder CiscoLogo

// Import styles for all Magnetic components used
// import '@magnetic/theme/styles.css';
import '@magnetic/button/styles.css';
import '@magnetic/header/styles.css'; // New: Header styles
import '@magnetic/container/styles.css'; // New: Container styles
// import '@magnetic/flex/styles.css'; // Already imported for Flex
import '@magnetic/text/styles.css'; // Already imported for Text
import './App.css';

function App() {
  const handleClick = () => {
    alert('Magnetic Button Clicked!');
  };

  // Define the 'content' variable for the profileAndTenant prop
  const profileContent = (
    <Container style={{ padding: '16px' }}>
      <Flex direction="vertical" gap="sm">
        <Text variant="body-md">Signed in as: Tier 1 Admin</Text>
        <Text variant="body-sm">ACME Corp, Inc</Text>
        {/* Add more profile content here as needed */}
        <button style={{ marginTop: '10px', padding: '8px 12px', cursor: 'pointer' }}>Sign Out</button>
      </Flex>
    </Container>
  );

  return (
    <div className="App">
      <Header
        href="https://magnetic-react.cisco.com"
        // logo={<CiscoLogo />} // Use your imported CiscoLogo
        productName="Meraki Admin JIT" // Customize your product name
        profileAndTenant={{
          icon: "user",
          profile: {
            heading: "Tier 1 Admin",
            subHeading: "ACME Corp, Inc"
          },
          content: profileContent, // Use the defined content variable
          tooltipLabel: "My profile"
        }}
      >

        <Header.Button icon="info" label="Info" onClick={() => console.log('Info button clicked')} />

      </Header>

      {/* Your existing app content */}
      <header className="App-header">
        <h1>Hello Magnetic World!</h1>
        <Button onClick={handleClick}>
          Click Me (Magnetic Button)
        </Button>
        <p>
          This is a simple React app using the Magnetic Design System.
        </p>
      </header>
    </div>
  );
}

export default App;