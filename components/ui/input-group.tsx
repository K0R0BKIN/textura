'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const inputGroupVariants = cva(
  'flex w-full min-w-0 items-center border border-input',
  {
    variants: {
      variant: {
        card: 'border-border bg-card shadow-xs',
      },
      size: {
        lg: 'h-14 rounded-2xl [&>input]:px-4 has-[>[data-align=inline-end]]:[&>input]:pr-3 has-[>[data-align=inline-start]]:[&>input]:pl-3',
      },
    },
  },
);

function InputGroup({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof inputGroupVariants>) {
  return (
    <div
      data-slot="input-group"
      data-size={size}
      role="group"
      className={cn(inputGroupVariants({ variant, size }), className)}
      {...props}
    />
  );
}

const inputGroupAddonVariants = cva('flex h-auto items-center select-none', {
  variants: {
    align: {
      'inline-end': 'order-last',
    },
    size: {
      lg: '',
    },
  },
  compoundVariants: [
    {
      align: 'inline-end',
      size: 'lg',
      className: 'pr-4 has-[>button]:-mr-2',
    },
  ],
});

function InputGroupAddon({
  className,
  align,
  size,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof inputGroupAddonVariants>) {
  return (
    <div
      role="group"
      data-slot="input-group-addon"
      data-align={align}
      className={cn(inputGroupAddonVariants({ align, size }), className)}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button')) {
          return;
        }
        e.currentTarget.parentElement?.querySelector('input')?.focus();
      }}
      {...props}
    />
  );
}

function InputGroupButton({
  className,
  type = 'button',
  variant,
  size,
  ...props
}: Omit<React.ComponentProps<typeof Button>, 'type'> & {
  type?: 'button' | 'submit' | 'reset';
}) {
  return (
    <Button
      type={type}
      size={size}
      variant={variant}
      className={className}
      {...props}
    />
  );
}

function InputGroupInput({
  className,
  ...props
}: React.ComponentProps<'input'>) {
  return (
    <Input
      data-slot="input-group-control"
      className={cn('flex-1', className)}
      {...props}
    />
  );
}

export { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput };
