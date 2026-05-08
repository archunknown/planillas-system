'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { SidebarContent } from './sidebar';
import type { Empresa } from '@prisma/client';

type Rol = 'ADMIN' | 'CONTADOR' | 'CLIENTE';

interface MobileNavProps {
  user: { name?: string | null; email?: string | null; rol: Rol; empresasIds: string[] };
  empresas: Empresa[];
  empresaActualId?: string;
}

export function MobileNav({ user, empresas, empresaActualId }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon" className="lg:hidden" />}>
        <Menu className="size-5" />
        <span className="sr-only">Abrir menú</span>
      </SheetTrigger>
      <SheetContent side="left" className="w-60 p-0">
        <SidebarContent
          user={user}
          empresas={empresas}
          empresaActualId={empresaActualId}
        />
      </SheetContent>
    </Sheet>
  );
}
