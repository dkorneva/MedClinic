import { Spin } from 'antd';

export default function PageLoading() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 48,
        height: '100%',
      }}
    >
      <Spin size="large" />
    </div>
  );
}
