'use client';

import { createContext, use, useLayoutEffect, useRef, useState } from 'react';
import { Menu as MenuPrimitive } from '@base-ui/react/menu';
import { FocusScope } from '@react-aria/focus';
import { AnimatePresence, motion, type HTMLMotionProps } from 'motion/react';
import { CheckIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

type DropdownMenuContextValue = {
  state: {
    open: boolean;
  };
};

type Side = NonNullable<MenuPrimitive.Popup.State['side']>;

const dropdownVariants = {
  hidden: (side: Side) => ({
    opacity: 0,
    scale: 0.95,
    x:
      side === 'left' || side === 'inline-start'
        ? 8
        : side === 'right' || side === 'inline-end'
          ? -8
          : 0,
    y: side === 'top' ? 8 : side === 'bottom' ? -8 : 0,
  }),
  visible: {
    opacity: 1,
    scale: 1,
    x: 0,
    y: 0,
  },
};

const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(
  null,
);

function useDropdownMenu() {
  const context = use(DropdownMenuContext);

  if (!context) {
    throw new Error('useDropdownMenu must be used within DropdownMenu.');
  }

  return context;
}

function DropdownMenu({
  children,
  ...props
}: Omit<MenuPrimitive.Root.Props, 'open' | 'onOpenChange' | 'actionsRef'>) {
  const actionsRef = useRef<MenuPrimitive.Root.Actions | null>(null);
  const [open, setOpen] = useState(false);

  useLayoutEffect(() => {
    const actions = actionsRef.current;

    return () => {
      actions?.unmount();
      setOpen(false);
    };
  }, []);

  return (
    <DropdownMenuContext.Provider
      value={{
        state: {
          open,
        },
      }}
    >
      <MenuPrimitive.Root
        data-slot="dropdown-menu"
        open={open}
        onOpenChange={setOpen}
        actionsRef={actionsRef}
        {...props}
      >
        {children}
      </MenuPrimitive.Root>
    </DropdownMenuContext.Provider>
  );
}

function DropdownMenuTrigger({ ...props }: MenuPrimitive.Trigger.Props) {
  return <MenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />;
}

function DropdownMenuGroup({ ...props }: MenuPrimitive.Group.Props) {
  return <MenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />;
}

function DropdownMenuLabel({
  className,
  ...props
}: MenuPrimitive.GroupLabel.Props) {
  return (
    <MenuPrimitive.GroupLabel
      data-slot="dropdown-menu-label"
      className={cn(
        'px-1.5 py-1 text-xs font-medium text-muted-foreground select-none',
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuContent({
  align = 'start',
  alignOffset = 0,
  side = 'bottom',
  sideOffset = 4,
  className,
  children,
  ...props
}: MenuPrimitive.Popup.Props &
  Pick<
    MenuPrimitive.Positioner.Props,
    'align' | 'alignOffset' | 'side' | 'sideOffset'
  >) {
  const {
    state: { open },
  } = useDropdownMenu();

  return (
    <AnimatePresence>
      {open && (
        <MenuPrimitive.Portal>
          <MenuPrimitive.Positioner
            className="isolate z-50 outline-none"
            align={align}
            alignOffset={alignOffset}
            side={side}
            sideOffset={sideOffset}
          >
            <MenuPrimitive.Popup
              data-slot="dropdown-menu-content"
              finalFocus={false}
              render={(renderProps, state) => (
                <motion.div
                  {...(renderProps as HTMLMotionProps<'div'>)}
                  custom={state.side}
                  variants={dropdownVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  transition={{
                    duration: 0.16,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                />
              )}
              className={cn(
                'z-50 max-h-(--available-height) min-w-32 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring ring-border outline-none',
                className,
              )}
              {...props}
            >
              <FocusScope restoreFocus>{children}</FocusScope>
            </MenuPrimitive.Popup>
          </MenuPrimitive.Positioner>
        </MenuPrimitive.Portal>
      )}
    </AnimatePresence>
  );
}

function DropdownMenuRadioGroup({ ...props }: MenuPrimitive.RadioGroup.Props) {
  return (
    <MenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  );
}

function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: MenuPrimitive.RadioItem.Props) {
  return (
    <MenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(
        "relative flex h-8 cursor-pointer items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground focus:**:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <span
        className="pointer-events-none absolute right-2 flex items-center justify-center"
        data-slot="dropdown-menu-radio-item-indicator"
      >
        <MenuPrimitive.RadioItemIndicator>
          <CheckIcon />
        </MenuPrimitive.RadioItemIndicator>
      </span>
      {children}
    </MenuPrimitive.RadioItem>
  );
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
};
