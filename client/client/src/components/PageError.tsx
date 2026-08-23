import { Alert } from 'antd';

interface Props {
  message?: string;
}

export default function PageError({ message = 'Something went wrong. Please try again.' }: Props) {
  return (
    <div style={{ padding: 48 }}>
      <Alert type="error" message={message} showIcon />
    </div>
  );
}
