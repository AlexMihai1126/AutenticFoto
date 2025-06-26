'use client';

import { Button } from 'react-bootstrap';
import { useRouter } from 'next/navigation';

export default function BackButton() {
  const router = useRouter();

  return (
    <Button variant="outline-secondary" className='mb-4 w-100' onClick={() => router.back()}>
      Înapoi
    </Button>
  );
}