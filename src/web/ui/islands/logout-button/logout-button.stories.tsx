import type { Meta, StoryObj } from '@storybook/react-vite';
import LogoutButton from './logout-button';

const meta = {
  title: 'Islands/LogoutButton',
  component: LogoutButton,
  decorators: [
    (Story) => (
      <div className="container py-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LogoutButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
