import 'server-only';

import { after } from 'next/server';
import { saveEditedArticle } from '@/lib/articles';
import type { Article, EditStreamMessage } from '@/lib/schemas';
import { editArticle } from './edit-article';

// Streams an article's edit as JSON lines and saves the result. The edit
// runs to completion even if the reader disconnects, so the next view gets
// the saved article.
export function streamEdit(article: Article) {
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController<Uint8Array> | undefined;
  let open = true;

  const send = (message: EditStreamMessage) => {
    if (!open || !controller) return;
    try {
      controller.enqueue(encoder.encode(`${JSON.stringify(message)}\n`));
    } catch {
      open = false;
    }
  };

  const body = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c;
    },
    cancel() {
      open = false;
    },
  });

  const job = editArticle(article, send)
    .then(saveEditedArticle)
    .catch((error: unknown) => {
      console.error(error);
      send({ type: 'error', message: 'Failed to edit the article' });
    })
    .finally(() => {
      if (open) {
        open = false;
        controller?.close();
      }
    });
  after(job);

  return new Response(body, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      // A stream is one reader's view of the first edit; later reads get the
      // saved article.
      'Cache-Control': 'no-store',
    },
  });
}
