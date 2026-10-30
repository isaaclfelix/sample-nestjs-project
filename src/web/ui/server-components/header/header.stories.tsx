import type { Meta, StoryObj } from '@storybook/react-vite';
import Header from './header';

const meta = {
  title: 'Server/Header',
  component: Header,
  args: { isAuthenticated: false },
} satisfies Meta<typeof Header>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Guest: Story = {
  args: { isAuthenticated: false },
};

export const Authenticated: Story = {
  args: { isAuthenticated: true },
};
