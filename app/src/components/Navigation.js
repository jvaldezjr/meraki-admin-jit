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
  { id: "home", label: "Home", icon: <Icon kind="home" />}, 
  { id: "my-access", label: "My Access", icon: <Icon kind="roles-and-permissions" /> },
  { id: "request-access", label: "Request Access", icon: <Icon kind="identity" /> },
  { id: "approvals", label: "Approvals", icon: <Icon kind="jobs" /> },
  { id: "snapshots", label: "Snapshots", icon: <Icon kind="operations" /> },
  { id: "change-log", label: "Change Log", icon: <Icon kind="change-log" /> },
];

const MyNavigation = ({ initialIsCollapsed = false, isIconOnly = false }) => {

  return (
    <Nav initialIsCollapsed={initialIsCollapsed} isIconOnly={isIconOnly} navZIndex={1}>
      <Nav.Collapse auto={true} /> {/* Add a collapse button */}

      <Nav.Menu>
        {myMenuItems.map(item => (
          <Nav.Item key={item.id} {...item} />
        ))}
        <Nav.Divider />
        <Nav.SectionLabel>Admin Tools</Nav.SectionLabel>
        <Nav.Item icon={<Icon kind="admin" />} label="Admin" href="/admin" />
      </Nav.Menu>
    </Nav>
  );
};

export default MyNavigation;