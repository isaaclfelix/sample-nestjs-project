import type { Meta, StoryObj } from '@storybook/react-vite';
import { LoginPage } from './login-page';

const meta = {
  title: 'Pages/LoginPage',
  component: LoginPage,
  args: { isAuthenticated: false },
} satisfies Meta<typeof LoginPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
