import { LanguageIcon } from '@heroicons/react/24/solid';
import { SunIcon } from '@radix-ui/react-icons';

interface ToolbarButtonProps {
  icon: React.ComponentType<{ className?: string }>;
}

function ToolbarButton({ icon: Icon }: ToolbarButtonProps) {
  return (
    <button className="btn btn-icon rounded-full bg-transparent hover:bg-(--bg-2-hover)">
      <Icon className="icon" />
    </button>
  );
}

export default function Toolbar() {
  return (
    <div
      className={`fixed top-0 flex h-16 w-full items-center justify-end px-3`}
    >
      <ToolbarButton icon={LanguageIcon} />
      <ToolbarButton icon={SunIcon} />
    </div>
  );
}
