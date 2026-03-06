import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type NavbarButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  'variant' | 'size'
> & {
  tooltip?: string;
};

export function NavbarButton({
  className,
  tooltip,
  ...props
}: NavbarButtonProps) {
  const button = (
    <Button
      variant="ghost"
      size="icon-lg"
      aria-label={tooltip}
      className={cn('rounded-full', className)}
      {...props}
    />
  );

  if (!tooltip) return button;

  return (
    <Tooltip>
      <TooltipTrigger render={button} />
      <TooltipContent side="bottom">{tooltip}</TooltipContent>
    </Tooltip>
  );
}
