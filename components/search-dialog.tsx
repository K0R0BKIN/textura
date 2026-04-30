'use client';

import { useLayoutEffect, useRef } from 'react';
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { FocusScope } from '@react-aria/focus';
import { SearchBox } from '@/components/search-box';
import { cn } from '@/lib/utils';

export const searchDialogHandle = DialogPrimitive.createHandle<null>();

export function toggleSearchDialog() {
  if (searchDialogHandle.isOpen) {
    searchDialogHandle.close();
  } else {
    searchDialogHandle.open(null);
  }
}

function DialogSearchBox({ onValidSubmit }: { onValidSubmit: () => void }) {
  return (
    <SearchBox.Provider onValidSubmit={onValidSubmit}>
      <SearchBox.Form />
    </SearchBox.Provider>
  );
}

export function SearchDialog() {
  const actionsRef = useRef<DialogPrimitive.Root.Actions | null>(null);

  useLayoutEffect(() => {
    const actions = actionsRef.current;

    return () => {
      actions?.close();
      actions?.unmount();
    };
  }, []);

  return (
    <DialogPrimitive.Root
      actionsRef={actionsRef}
      handle={searchDialogHandle}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 isolate z-50" />
        <DialogPrimitive.Popup
          finalFocus={false}
          className={cn(
            'fixed top-1/4 left-1/2 z-50 -translate-x-1/2 translate-y-0 duration-100 will-change-transform outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
          )}
        >
          <FocusScope restoreFocus>
            <DialogSearchBox
              onValidSubmit={() => actionsRef.current?.close()}
            />
          </FocusScope>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
