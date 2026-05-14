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
import { Composer } from '@/components/composer';

export const metadata: Metadata = {
  title: 'Chat',
};

const messages = [
  {
    id: 'opening-question',
    role: 'user',
    parts: [
      {
        type: 'text',
        text: 'I’m editing a short essay and keep using “careful.” Can you help me vary it without changing the tone too much?',
      },
    ],
  },
  {
    id: 'opening-answer',
    role: 'assistant',
    parts: [
      {
        type: 'text',
        text: [
          'Yes. The safest replacements depend on what kind of care you mean.',
          '',
          '- If the person is avoiding risk, try cautious, prudent, or measured.',
          '- If the person is paying close attention, try attentive, observant, or watchful.',
          '- If the work is detailed, try thorough, precise, or meticulous.',
          '- If the action is slow and intentional, try deliberate or considered.',
          '',
          'For an essay, I would reach first for attentive, thorough, considered, and precise. They are flexible without sounding dramatic.',
        ].join('\n'),
      },
    ],
  },
  {
    id: 'sentence-question',
    role: 'user',
    parts: [
      {
        type: 'text',
        text: 'The sentence is: “The author offers a careful reading of the poem.”',
      },
    ],
  },
  {
    id: 'sentence-answer',
    role: 'assistant',
    parts: [
      {
        type: 'text',
        text: [
          'Use “close” there: “The author offers a close reading of the poem.”',
          '',
          'That phrase is idiomatic in literary criticism. It means the reading is detailed, text-sensitive, and attentive to small choices in language. “Attentive reading” is also possible, but it describes the reader’s manner more than the critical method.',
        ].join('\n'),
      },
    ],
  },
  {
    id: 'tone-question',
    role: 'user',
    parts: [
      {
        type: 'text',
        text: 'What if I want it to sound less academic?',
      },
    ],
  },
  {
    id: 'tone-answer',
    role: 'assistant',
    parts: [
      {
        type: 'text',
        text: [
          'Then I would avoid “close reading,” because it carries a classroom or criticism-paper feel.',
          '',
          'A more neutral version would be: “The author reads the poem with attention to its smaller details.”',
          '',
          'That keeps the meaning but sounds less like a term of art. If the surrounding prose is very plain, you could shorten it even further: “The author pays attention to the poem’s smaller details.”',
        ].join('\n'),
      },
    ],
  },
  {
    id: 'another-sentence-question',
    role: 'user',
    parts: [
      {
        type: 'text',
        text: 'Another one: “She made a careful choice to leave the ending unresolved.”',
      },
    ],
  },
  {
    id: 'another-sentence-answer',
    role: 'assistant',
    parts: [
      {
        type: 'text',
        text: [
          'I would use “deliberate” or “considered.”',
          '',
          '“She made a deliberate choice to leave the ending unresolved” suggests intention and artistic control. It is probably the cleanest version.',
          '',
          '“She made a considered choice” is softer. It implies she weighed the decision, but it does not emphasize control quite as strongly.',
        ].join('\n'),
      },
    ],
  },
  {
    id: 'concern-question',
    role: 'user',
    parts: [
      {
        type: 'text',
        text: 'Does “deliberate choice” sound redundant?',
      },
    ],
  },
  {
    id: 'concern-answer',
    role: 'assistant',
    parts: [
      {
        type: 'text',
        text: [
          'A little, but not fatally. “Choice” already implies intention, so “deliberate choice” can feel padded if the sentence is otherwise spare.',
          '',
          'You could tighten it to: “She deliberately leaves the ending unresolved.”',
          '',
          'That version is stronger because the adverb modifies the action directly. It also removes the abstract noun “choice,” which often makes prose feel heavier than it needs to be.',
        ].join('\n'),
      },
    ],
  },
  {
    id: 'revision-question',
    role: 'user',
    parts: [
      {
        type: 'text',
        text: 'Nice. Can you compare these three?',
      },
    ],
  },
  {
    id: 'revision-answer',
    role: 'assistant',
    parts: [
      {
        type: 'text',
        text: [
          'Sure.',
          '',
          '“She made a careful choice to leave the ending unresolved” sounds cautious and slightly vague. It could mean she was thoughtful, but it could also mean she was trying not to make a mistake.',
          '',
          '“She made a deliberate choice to leave the ending unresolved” sounds intentional and interpretive. It tells the reader that the unresolved ending is not accidental.',
          '',
          '“She deliberately leaves the ending unresolved” is the most direct. It keeps the emphasis on the author’s action rather than on the idea of choosing.',
          '',
          'For clean essay prose, I would pick the third unless you need to emphasize the decision-making process itself.',
        ].join('\n'),
      },
    ],
  },
  {
    id: 'register-question',
    role: 'user',
    parts: [
      {
        type: 'text',
        text: 'What about “meticulous”? I like it, but I’m worried it’s too much.',
      },
    ],
  },
  {
    id: 'register-answer',
    role: 'assistant',
    parts: [
      {
        type: 'text',
        text: [
          'Your instinct is good. “Meticulous” is useful, but it has a narrower feel than “careful.” It suggests painstaking attention to detail, sometimes to the point of fussiness.',
          '',
          'It works well for craft, documentation, research, restoration, annotation, and technical work. It can sound odd for ordinary judgment or emotional restraint.',
          '',
          'For example, “a meticulous archive” sounds natural. “A meticulous decision to forgive him” sounds strange, because forgiveness is not usually imagined as detail work.',
        ].join('\n'),
      },
    ],
  },
  {
    id: 'summary-question',
    role: 'user',
    parts: [
      {
        type: 'text',
        text: 'Can you give me a quick rule of thumb?',
      },
    ],
  },
  {
    id: 'summary-answer',
    role: 'assistant',
    parts: [
      {
        type: 'text',
        text: [
          'A good rule of thumb:',
          '',
          '- Use cautious when danger or risk matters.',
          '- Use attentive when perception or listening matters.',
          '- Use thorough when completeness matters.',
          '- Use precise when accuracy matters.',
          '- Use deliberate when intention matters.',
          '- Use meticulous when small details matter intensely.',
          '',
          'If none of those meanings is clearly present, keep “careful.” Sometimes the plain word is doing exactly the right amount of work.',
        ].join('\n'),
      },
    ],
  },
  {
    id: 'final-question',
    role: 'user',
    parts: [
      {
        type: 'text',
        text: 'That helps. Last sentence: “The critic is careful not to overstate the poem’s optimism.”',
      },
    ],
  },
  {
    id: 'final-answer',
    role: 'assistant',
    parts: [
      {
        type: 'text',
        text: [
          'I would keep “careful” or use “careful not to” as the pattern.',
          '',
          '“The critic is careful not to overstate the poem’s optimism” is natural because the phrase means the critic avoids a specific interpretive mistake. “Cautious not to” is possible but less idiomatic. “Measured” could also work if you recast the sentence: “The critic offers a measured account of the poem’s optimism.”',
          '',
          'My final version would depend on the paragraph:',
          '',
          '“The critic is careful not to overstate the poem’s optimism.”',
          '',
          'or',
          '',
          '“The critic offers a measured account of the poem’s optimism.”',
        ].join('\n'),
      },
    ],
  },
] satisfies UIMessage[];

export default function ChatPage() {
  return (
    <>
      <section className="mx-auto max-w-3xl">
        <Conversation>
          <ConversationContent className="px-8">
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

      <div className="fixed inset-x-0 bottom-0">
        <div className="mx-auto max-w-3xl bg-background px-4 pb-3">
          <Composer className="w-full" />
        </div>
      </div>
    </>
  );
}
