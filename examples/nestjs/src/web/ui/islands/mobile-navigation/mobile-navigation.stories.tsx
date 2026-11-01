import type { Meta, StoryObj } from '@storybook/react-vite';
import MobileNavigation from './mobile-navigation';

const meta = {
  title: 'Islands/MobileNavigation',
  component: MobileNavigation,
  args: { isAuthenticated: false },
} satisfies Meta<typeof MobileNavigation>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Guest: Story = {
  args: { isAuthenticated: false },
};

export const Authenticated: Story = {
  args: { isAuthenticated: true },
};
