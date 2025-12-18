import React from 'react';
import { Container } from '@magnetic/container';
import { Text } from '@magnetic/text';
import { Flex } from '@magnetic/flex';

const ChangeLogPage = () => {
  return (
    <Container>
      <Flex direction="column" gap="large" padding="large">
        <Text variant="h1">Change Log</Text>
        <Text variant="body">
          This page will display a history of all access changes and modifications.
        </Text>
        <Text variant="body" color="subdued">
          Coming soon...
        </Text>
      </Flex>
    </Container>
  );
};

export default ChangeLogPage;

