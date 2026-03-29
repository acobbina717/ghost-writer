import { Center, Loader, type CenterProps } from '@mantine/core';

interface PageSpinnerProps {
  h?: CenterProps['h'];
}

export function PageSpinner({ h = '100vh' }: PageSpinnerProps) {
  return (
    <Center h={h}>
      <Loader size="lg" />
    </Center>
  );
}
