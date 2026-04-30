'use client';

import { SearchBox } from '@/components/search-box';

export default function HomeSearchBox() {
  return (
    <SearchBox.Provider>
      <SearchBox.Form />
    </SearchBox.Provider>
  );
}
