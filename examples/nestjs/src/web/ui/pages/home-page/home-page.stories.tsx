import type { Meta, StoryObj } from '@storybook/react-vite';
import { HomePage } from './home-page';

const meta = {
  title: 'Pages/HomePage',
  component: HomePage,
  args: {
    renderedAt: '2026-10-29T12:00:00.000Z',
    isAuthenticated: false,
  },
} satisfies Meta<typeof HomePage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Guest: Story = {
  args: { isAuthenticated: false },
};

export const Authenticated: Story = {
  args: { isAuthenticated: true },
};
