'use client';

import { Toast } from '@base-ui/react/toast';
import { SearchBox, toastManager } from '@/components/search-box';

export default function HomeSearchBox() {
  return (
    <Toast.Provider toastManager={toastManager} limit={1}>
      <SearchBox.Provider>
        <SearchBox.Inner />
        <SearchBox.Toasts />
      </SearchBox.Provider>
    </Toast.Provider>
  );
}
