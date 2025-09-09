// src/components/Layout.js
import { Flex } from '@magnetic/flex';
import { Text } from '@magnetic/text';
// import CiscoLogo from './CiscoLogo'; // Assuming CiscoLogo.js is in the same directory (src/components/)

// Import styles for Magnetic components.
// Remember to comment out if you encounter "Package path ./styles.css is not exported" errors.
// import '@magnetic/theme/styles.css'; // Global theme styles
import '@magnetic/header/styles.css';
import '@magnetic/nav/styles.css';
import '@magnetic/container/styles.css';
import '@magnetic/text/styles.css';
import '@magnetic/skeleton/styles.css'; // Skeleton styles
import AppHeader from './AppHeader'; // Import the new AppHeader component
import MyNavigation from './Navigation'; // Import your custom navigation component

const Layout = ({ children }) => {
  const headerHeight = '56px'; // Define header height (adjust if your AppHeader is taller)
  const navWidth = '264px';   // 240px content + 12px padding on each side

  return (
    <div className="App">
      {/* AppHeader is assumed to be fixed at the top. Its own styles (in AppHeader.js) or
          the theme should handle its fixed positioning.
          If not, you'd add: style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999 }}
          to the root element rendered by AppHeader.js. */}
      <AppHeader />

      {/* This div acts as the main container for the content below the header */}
      {/* It uses flexbox to arrange the fixed navigation and scrollable main content horizontally */}
      <div style={{
        display: 'flex', // Make this a flex container
        flexDirection: 'row', // Arrange children (nav and main content) horizontally
        paddingTop: headerHeight, // Push content down by the header's height
        minHeight: `100vh`, // Ensure it covers the full viewport height
        boxSizing: 'border-box', // Include padding in height calculation
      }}>
        {/* Left Navigation Sidebar - Fixed Position */}
        <div style={{
          width: navWidth,
          borderRight: '1px solid var(--magnetic-color-neutral-200)',
          backgroundColor: 'var(--magnetic-color-neutral-50)',
          position: 'fixed', // Fix its position on the screen
          top: headerHeight, // Start below the header
          bottom: 0, // Extend to the bottom of the viewport
        //   overflowY: 'auto', // Allow navigation content to scroll if it overflows
          padding: '12px', // 12px padding on each side
          boxSizing: 'border-box', // Include padding in width/height
          zIndex: 900 // Ensure it's above main content but below header
        }}>
          <MyNavigation /> {/* Your Magnetic Navigation component */}
        </div>

        {/* Right Main Content Area - Occupies remaining space, pushed by fixed nav */}
        <div style={{
          flexGrow: 1, // Allows this div to take up all all available horizontal space
          marginLeft: navWidth, // Push content to the right of the fixed nav
          padding: '24px', // Add padding to the main content area
          boxSizing: 'border-box', // Include padding in width
        //   overflowY: 'visible', // Allow main content to scroll vertically
        }}>
          {/* Use a Flex component here if you want to use Magnetic's flexbox for internal content layout */}
          <Flex direction="vertical" gap="lg" style={{ minHeight: '100%' }}>
            {children} {/* This is where the page content will be rendered! */}
          </Flex>
        </div>
      </div>
    </div>
  );
};

export default Layout;
