import type { Meta, StoryObj } from '@storybook/react-vite';
import Icon from './icon';

const meta = {
  title: 'Shared/Icon',
  component: Icon,
  args: { name: 'list' },
  argTypes: {
    name: { control: 'select', options: ['list', 'x-lg'] },
  },
} satisfies Meta<typeof Icon>;

export default meta;

type Story = StoryObj<typeof meta>;

export const List: Story = {
  args: { name: 'list' },
};

export const XLg: Story = {
  args: { name: 'x-lg' },
};
