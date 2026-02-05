import { InputGroup, InputGroupInput } from '@/components/ui/input-group';

export function SearchBox() {
  return (
    <InputGroup variant="card" size="lg" className="w-lg">
      <InputGroupInput
        type="search"
        name="query"
        enterKeyHint="search"
        placeholder="Look up definitions…"
        aria-label="Search query"
        autoFocus
      />
    </InputGroup>
  );
}
