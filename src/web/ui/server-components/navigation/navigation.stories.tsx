import type { Meta, StoryObj } from '@storybook/react-vite';
import Navigation from './navigation';

const meta = {
  title: 'Server/Navigation',
  component: Navigation,
  args: { isAuthenticated: false },
} satisfies Meta<typeof Navigation>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Guest: Story = {
  args: { isAuthenticated: false },
};

export const Authenticated: Story = {
  args: { isAuthenticated: true },
};
