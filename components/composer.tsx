import { InputGroup, InputGroupInput } from '@/components/ui/input-group';

export function Composer() {
  return (
    <InputGroup>
      <InputGroupInput
        placeholder="Look up definitions..."
        aria-label="Search query"
        autoFocus
      />
    </InputGroup>
  );
}
