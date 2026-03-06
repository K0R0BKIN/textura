'use client';

import { RotateCw } from 'lucide-react';
import { NavbarButton } from '@/components/navbar/navbar-button';
import { revalidateArticles } from '@/lib/actions';

export default function RegenerateButton() {
  return (
    <NavbarButton tooltip="Regenerate" onClick={() => revalidateArticles()}>
      <RotateCw />
    </NavbarButton>
  );
}
