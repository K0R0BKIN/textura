'use client';

import { createContext, use, type ReactNode } from 'react';
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { FocusScope } from '@react-aria/focus';
import { AnimatePresence, motion, type Variants } from 'motion/react';

import { cn } from '@/lib/utils';

type DialogProps = DialogPrimitive.Root.Props & {
  open: boolean;
};

const DialogOpenContext = createContext<boolean | null>(null);

const contentVariants = {
  closed: {
    opacity: 0,
  },
  open: {
    opacity: 1,
  },
} satisfies Variants;

function useDialogOpen() {
  const open = use(DialogOpenContext);

  if (open === null) {
    throw new Error('useDialogOpen must be used within Dialog.');
  }

  return open;
}

function Dialog({ open, children, ...props }: DialogProps) {
  return (
    <DialogOpenContext.Provider value={open}>
      <DialogPrimitive.Root data-slot="dialog" open={open} {...props}>
        {children}
      </DialogPrimitive.Root>
    </DialogOpenContext.Provider>
  );
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogContent({
  className,
  children,
  variants = contentVariants,
  ...props
}: DialogPrimitive.Popup.Props & {
  children: ReactNode;
  variants?: Variants;
}) {
  const open = useDialogOpen();

  return (
    <AnimatePresence>
      {open && (
        <DialogPrimitive.Portal>
          <DialogPrimitive.Backdrop
            data-slot="dialog-backdrop"
            className="fixed inset-0 isolate z-50"
          />
          <DialogPrimitive.Popup
            data-slot="dialog-content"
            finalFocus={false}
            render={
              <motion.div
                variants={variants}
                initial="closed"
                animate="open"
                exit="closed"
              />
            }
            className={cn(
              'fixed top-1/2 left-1/2 z-50 -translate-x-1/2 will-change-transform outline-none',
              className,
            )}
            {...props}
          >
            <FocusScope restoreFocus>{children}</FocusScope>
          </DialogPrimitive.Popup>
        </DialogPrimitive.Portal>
      )}
    </AnimatePresence>
  );
}

export { Dialog, DialogContent, DialogTrigger };
