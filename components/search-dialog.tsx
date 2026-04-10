'use client';

import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { FocusScope } from '@react-aria/focus';
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
      return;
    }

    searchDialogHandle.open(null);
  });

  return (
    <DialogPrimitive.Root handle={searchDialogHandle}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 isolate z-50" />
        {/* Base UI restores focus to the detached trigger on close.
            For Cmd+K opens, that incorrectly lands focus on the search
            button and can show a focus ring even though the button wasn't
            the origin of the interaction. We disable that behavior and let
            FocusScope restore the previously focused element instead. */}
        <DialogPrimitive.Popup
          finalFocus={false}
          className={cn(
            'fixed top-1/4 left-1/2 z-50 -translate-x-1/2 translate-y-0 duration-100 will-change-transform outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
          )}
        >
          <FocusScope restoreFocus>
            <DialogSearchBox />
          </FocusScope>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
