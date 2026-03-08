import { cn } from '@/lib/utils';

function Kbd({ className, ...props }: React.ComponentProps<'kbd'>) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        'pointer-events-none inline-flex w-fit items-center justify-center font-sans text-base leading-none font-normal text-muted-foreground select-none',
        className,
      )}
      {...props}
    />
  );
}

export { Kbd };
