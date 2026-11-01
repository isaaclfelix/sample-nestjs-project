import type { Meta, StoryObj } from '@storybook/react-vite';
import Layout from './layout';

const meta = {
  title: 'Server/Layout',
  component: Layout,
  args: {
    isAuthenticated: false,
    children: <p className="container py-4">Page body placeholder.</p>,
  },
} satisfies Meta<typeof Layout>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Guest: Story = {
  args: { isAuthenticated: false },
};

export const Authenticated: Story = {
  args: { isAuthenticated: true },
};
