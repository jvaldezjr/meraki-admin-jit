import React from 'react';
import { Container } from '@magnetic/container';
import { Text } from '@magnetic/text';
import { Flex } from '@magnetic/flex';

const ApprovalsPage = () => {
  return (
    <Container>
      <Flex direction="column" gap="large" padding="large">
        <Text variant="h1">Approvals</Text>
        <Text variant="body">
          This page will display pending access requests that require approval.
        </Text>
        <Text variant="body" color="subdued">
          Coming soon...
        </Text>
      </Flex>
    </Container>
  );
};

export default ApprovalsPage;

