'use client';

import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { Toast } from '@base-ui/react/toast';
import { useHotkey } from '@tanstack/react-hotkeys';
import { SearchBox, toastManager } from '@/components/search-box';
import { Dialog, DialogContent } from '@/components/ui/dialog';

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
    <Dialog handle={searchDialogHandle}>
      <DialogContent className="top-1/4 translate-y-0">
        <DialogSearchBox />
      </DialogContent>
    </Dialog>
  );
}
