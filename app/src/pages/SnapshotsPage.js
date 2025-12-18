import React from 'react';
import { Container } from '@magnetic/container';
import { Text } from '@magnetic/text';
import { Flex } from '@magnetic/flex';

const SnapshotsPage = () => {
  return (
    <Container>
      <Flex direction="column" gap="large" padding="large">
        <Text variant="h1">Snapshots</Text>
        <Text variant="body">
          This page will display snapshots of access permissions at various points in time.
        </Text>
        <Text variant="body" color="subdued">
          Coming soon...
        </Text>
      </Flex>
    </Container>
  );
};

export default SnapshotsPage;

