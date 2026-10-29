import type { Meta, StoryObj } from '@storybook/react-vite';
import { RegisterPage } from './register-page';

const meta = {
  title: 'Pages/RegisterPage',
  component: RegisterPage,
  args: { isAuthenticated: false },
} satisfies Meta<typeof RegisterPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
