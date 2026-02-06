'use client';

import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva('', {
  variants: {
    variant: {
      default:
        'bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-primary/80 dark:hover:bg-primary/90',
    },
    size: {
      default: '',
      'icon-lg': 'size-10',
    },
  },
});

function Button({
  className,
  variant,
  size,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
