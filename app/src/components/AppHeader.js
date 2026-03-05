// src/components/AppHeader.js
import { Header } from '@magnetic/header';
import { Container } from '@magnetic/container';
import { useAuth } from '../contexts/AuthContext';
import CiscoLogo from './CiscoLogo';

// Import styles specific to the header components
import '@magnetic/header/styles.css';
import '@magnetic/container/styles.css';


const AppHeader = () => {
  const { user, loading, logout } = useAuth();

  // Full display name from IdP: shown in the expanded dropdown (ProfileSection)
  const displayName = user?.name || user?.email || null;
  // First name: prefer IdP first_name, otherwise derive from first word of displayName for header bar
  const firstName = (user?.first_name && user.first_name.trim())
    ? user.first_name.trim()
    : (displayName && displayName.trim().split(/\s+/)[0]) || null;
  const organization = user?.organization || user?.org || null;

  const headerContent = user ? (
    <Container className="app-header-profile-content" style={{ width: 362 }}>
      <Header.UserProfile
        profile={{
          user: {
            email: user.email || '',
            name: displayName || undefined,
          },
          onLogout: logout,
          localization: { logout: 'Sign Out' },
          ...(organization && { data: { Organization: organization } }),
        }}
      />
    </Container>
  ) : null;

  // Header bar: show firstName when present, otherwise displayName, then email, then fallback
  const profileHeading = loading
    ? 'Loading...'
    : (firstName || displayName || user?.email || 'Account');
  const profileSubHeading = loading ? '' : (organization || '');

  return (
    <Header
      href="/"
      logo={<CiscoLogo />}
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
    />
  );
};

export default AppHeader;