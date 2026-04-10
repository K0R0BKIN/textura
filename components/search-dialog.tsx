'use client';

import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { Toast } from '@base-ui/react/toast';
import { useHotkey } from '@tanstack/react-hotkeys';
import { SearchBox, toastManager } from '@/components/search-box';
import { cn } from '@/lib/utils';

export const searchDialogHandle = DialogPrimitive.createHandle();

function DialogSearchBox() {
  return (
    <Toast.Provider toastManager={toastManager} limit={1}>
      <SearchBox.Provider onValidSubmit={() => searchDialogHandle.close()}>
        <SearchBox.Inner />
        <SearchBox.Toasts />
      </SearchBox.Provider>
    </Toast.Provider>
  );
}

export function SearchDialog() {
  useHotkey('Mod+K', () => {
    if (searchDialogHandle.isOpen) {
      searchDialogHandle.close();
    } else {
      searchDialogHandle.open(null);
    }
  });

  return (
    <DialogPrimitive.Root handle={searchDialogHandle}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 isolate z-50" />
        <DialogPrimitive.Popup
          className={cn(
            'fixed top-1/4 left-1/2 z-50 -translate-x-1/2 translate-y-0 duration-100 outline-none will-change-transform data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
          )}
        >
        <DialogSearchBox />
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
