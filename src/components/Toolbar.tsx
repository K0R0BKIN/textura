import { LanguageIcon } from '@heroicons/react/24/solid';
import { SunIcon } from '@radix-ui/react-icons';

interface IconButtonProps {
  icon: React.ComponentType<{ className?: string }>;
}

function IconButton({ icon: Icon }: IconButtonProps) {
  return (
    <button className="btn flex size-10 items-center justify-center rounded-full bg-transparent hover:bg-(--accent-bg-hover)">
      <Icon className="size-5" />
    </button>
  );
}

export default function Toolbar() {
  return (
    <div
      className={`fixed top-0 flex h-16 w-full items-center justify-end px-3`}
    >
      <IconButton icon={LanguageIcon} />
      <IconButton icon={SunIcon} />
    </div>
  );
}
