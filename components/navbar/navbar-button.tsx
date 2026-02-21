import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type NavbarButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  'variant' | 'size'
>;

export function NavbarButton({ className, ...props }: NavbarButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon-lg"
      className={cn('rounded-full', className)}
      {...props}
    />
  );
}
