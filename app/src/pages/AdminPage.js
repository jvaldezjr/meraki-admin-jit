import React from 'react';
import { Container } from '@magnetic/container';
import { Text } from '@magnetic/text';
import { Flex } from '@magnetic/flex';

const AdminPage = () => {
  return (
    <Container>
      <Flex direction="column" gap="large" padding="large">
        <Text variant="h1">Admin Tools</Text>
        <Text variant="body">
          This page will provide administrative tools for managing the JIT access system.
        </Text>
        <Text variant="body" color="subdued">
          Coming soon...
        </Text>
      </Flex>
    </Container>
  );
};

export default AdminPage;

