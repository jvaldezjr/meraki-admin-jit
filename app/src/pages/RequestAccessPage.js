import React from 'react';
import { Container } from '@magnetic/container';
import { Text } from '@magnetic/text';
import { Flex } from '@magnetic/flex';

const RequestAccessPage = () => {
  return (
    <Container>
      <Flex direction="column" gap="large" padding="large">
        <Text variant="h1">Request Access</Text>
        <Text variant="body">
          This page will allow users to request Just-in-Time (JIT) access to Meraki resources.
        </Text>
        <Text variant="body" color="subdued">
          Coming soon...
        </Text>
      </Flex>
    </Container>
  );
};

export default RequestAccessPage;

