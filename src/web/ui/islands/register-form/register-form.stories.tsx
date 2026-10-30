import type { Meta, StoryObj } from '@storybook/react-vite';
import RegisterForm from './register-form';

const meta = {
  title: 'Islands/RegisterForm',
  component: RegisterForm,
  decorators: [
    (Story) => (
      <div className="container py-4">
        <div className="row justify-content-center">
          <div className="col-12 col-md-6 col-lg-4">
            <Story />
          </div>
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof RegisterForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
