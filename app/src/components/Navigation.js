import React, { useState } from 'react';
import { Nav, Icon } from '@magnetic/nav';
// Import other components used within Nav, like Input, Button, Flex, Text, etc.
import { Input } from '@magnetic/input';
import { Button } from '@magnetic/button';
import { MagnifyingGlass, Plus } from '@magnetic/icons'; // For search/add buttons

// ADD THESE IMPORTS:
import { Flex } from '@magnetic/flex';

// Assume you have your mock data defined elsewhere or directly here
const myMenuItems = [
  { id: "home", label: "Home", icon: <Icon kind="home" />, drawerContentId: "home-content" },
  { id: "apps", label: "Applications", icon: <Icon kind="applications" />, drawerContentId: "applications-content" },
  { id: "org-switcher", label: "My Organization", icon: <Icon kind="organization-switcher" />, drawerContentId: "organization-content", switcher: true },
];

const homeProductivityItems = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "Analytics", href: "/analytics", isNew: true, tagText: "New" },
];

const myOrganizations = ["Acme Corp", "Beta Inc", "Gamma Ltd"];

const MyNavigation = ({ initialIsCollapsed = false, isIconOnly = false }) => {
  const [selectedOrg, setSelectedOrg] = useState(myOrganizations[0]);
  const [searchInput, setSearchInput] = useState("");

  const filteredOrgs = myOrganizations.filter(org =>
    org.toLowerCase().includes(searchInput.toLowerCase())
  );

  return (
    <Nav initialIsCollapsed={initialIsCollapsed} isIconOnly={isIconOnly} navZIndex={1}>
      <Nav.Collapse auto={true} /> {/* Add a collapse button */}

      <Nav.Menu>
        {myMenuItems.map(item => (
          <Nav.Item key={item.id} {...item} />
        ))}
        {/* <Nav.Divider />
        <Nav.SectionLabel>Admin Tools</Nav.SectionLabel>
        <Nav.Item icon={<Icon kind="access-management" />} label="User Management" href="/users" /> */}
      </Nav.Menu>

      <Nav.Drawer>
        {/* Content for "home-content" drawer */}
        <Nav.Drawer.Content id="home-content" heading="Home Overview">
          <Nav.Drawer.ItemGroup label="Quick Access">
            {homeProductivityItems.map(item => (
              <Nav.Drawer.Item key={item.title} href={item.href} isNew={item.isNew} tagText={item.tagText}>
                {item.title}
              </Nav.Drawer.Item>
            ))}
          </Nav.Drawer.ItemGroup>
        </Nav.Drawer.Content>

        {/* Content for "applications-content" drawer */}
        <Nav.Drawer.Content id="applications-content" heading="Applications">
          <Nav.Drawer.Item>Meraki Dashboard</Nav.Drawer.Item>
          <Nav.Drawer.Item>Webex</Nav.Drawer.Item>
        </Nav.Drawer.Content>

        {/* Content for "organization-content" drawer (with search) */}
        <Nav.Drawer.Content id="organization-content" heading="Select Organization">
          <Flex direction="vertical" gap={8} style={{ marginBottom: "12px" }}>
            <Input
              label="Search"
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search for organization"
              prefix={<MagnifyingGlass />}
              value={searchInput}
            />
            <Button icon={<Plus />} kind="tertiary">
              Create New Org
            </Button>
          </Flex>
          {filteredOrgs.map(org => (
            <Nav.Drawer.Item
              key={org}
              onClick={() => setSelectedOrg(org)}
              selected={org === selectedOrg}
            >
              {org}
            </Nav.Drawer.Item>
          ))}
        </Nav.Drawer.Content>
      </Nav.Drawer>
    </Nav>
  );
};

export default MyNavigation;