import { Alert } from 'antd';

interface Props {
  title?: string;
  errors?: string[];
}

export default function PageValidation({ title = 'Please fix the following errors', errors }: Props) {

  const description = errors?.length ? ( 
    <ul style={{ margin: 0, paddingLeft: 20 }}>
      {errors.map((err, i) => (
        <li key={i}>{err}</li>
      ))}
    </ul>
  ) : undefined; 

  return (
    <div style={{ marginBottom: 16 }}>
      <Alert type="warning" showIcon message={title} description={description} />
    </div>
  );
}
