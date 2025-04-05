import { ActionIcon } from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';
import { useTheme } from '../contexts/ThemeContext';

export function ThemeToggle() {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <ActionIcon
      variant="filled"
      color="purple"
      size="xl"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      style={{ marginRight: '10px' }}
    >
      {isDarkMode ? <IconSun size={24} /> : <IconMoon size={24} />}
    </ActionIcon>
  );
} 