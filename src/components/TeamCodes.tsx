import { Badge, ActionIcon, CopyButton, Tooltip } from '@mantine/core';
import { IconCopy, IconCheck } from '@tabler/icons-react';

export const CodeBox = ({ code }: { code: string }) => (
    <Badge 
        variant="light" 
        color="gray" 
        size="lg" 
        radius="sm" 
        styles={{ root: { textTransform: 'none', fontFamily: 'monospace', letterSpacing: 1, fontSize: 14 } }}
    >
        {code}
    </Badge>
);

export const CopyBtn = ({ value }: { value: string }) => (
    <CopyButton value={value} timeout={2000}>
      {({ copied, copy }) => (
        <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow position="right">
          <ActionIcon color={copied ? 'teal' : 'gray'} variant="subtle" onClick={copy}>
            {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
          </ActionIcon>
        </Tooltip>
      )}
    </CopyButton>
);
