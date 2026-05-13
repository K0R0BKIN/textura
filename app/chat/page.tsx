import type { Metadata } from 'next';
import type { UIMessage } from 'ai';

import {
  Conversation,
  ConversationContent,
} from '@/components/ai-elements/conversation';
import {
  Message,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message';

export const metadata: Metadata = {
  title: 'Chat',
};

const messages = [
  {
    id: 'synonym-question',
    role: 'user',
    parts: [
      {
        type: 'text',
        text: 'What are some synonyms for “careful”?',
      },
    ],
  },
  {
    id: 'synonym-answer',
    role: 'assistant',
    parts: [
      {
        type: 'text',
        text: [
          'A few useful synonyms are cautious, attentive, thorough, deliberate, and meticulous.',
          '',
          'They are close, but not identical. Cautious usually means careful because there is some risk. Attentive means careful because you are paying close attention. Thorough and meticulous both suggest care in the details, with meticulous feeling a little more precise or exacting.',
        ].join('\n'),
      },
    ],
  },
  {
    id: 'example-question',
    role: 'user',
    parts: [
      {
        type: 'text',
        text: 'Which one fits “a careful reading of the poem”?',
      },
    ],
  },
  {
    id: 'example-answer',
    role: 'assistant',
    parts: [
      {
        type: 'text',
        text: [
          '“Close” is probably the most natural choice: “a close reading of the poem.” It is the standard phrase when you mean a careful, detailed interpretation of a text.',
          '',
          '“Attentive” also works, especially if you want to emphasize the reader’s focus. “Meticulous” would sound a little too mechanical here unless the reading is unusually detailed or scholarly.',
        ].join('\n'),
      },
    ],
  },
] satisfies UIMessage[];

export default function ChatPage() {
  return (
    <section className="mx-auto max-w-2xl px-4">
      <Conversation>
        <ConversationContent>
          {messages.map((message) => (
            <Message from={message.role} key={message.id}>
              <MessageContent>
                {message.parts.map((part, index) => {
                  if (part.type !== 'text') return null;

                  return (
                    <MessageResponse key={`${message.id}-${index}`}>
                      {part.text}
                    </MessageResponse>
                  );
                })}
              </MessageContent>
            </Message>
          ))}
        </ConversationContent>
      </Conversation>
    </section>
  );
}
