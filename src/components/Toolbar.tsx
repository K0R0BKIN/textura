import { LanguageIcon } from '@heroicons/react/24/solid';
import { SunIcon } from '@radix-ui/react-icons';

function ToolbarButton({ children }: { children: React.ReactNode }) {
  return (
    <button className="btn flex size-10 items-center justify-center rounded-full bg-transparent hover:bg-(--accent-bg-hover) [&>svg]:size-5">
      {children}
    </button>
  );
}

export default function Toolbar() {
  return (
    <div className="fixed top-0 flex h-16 w-full items-center justify-end px-3">
      <ToolbarButton>
        <LanguageIcon />
      </ToolbarButton>
      <ToolbarButton>
        <SunIcon />
      </ToolbarButton>
    </div>
  );
}
