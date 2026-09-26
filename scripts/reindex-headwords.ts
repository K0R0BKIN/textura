import '@/envConfig';
import { algoliasearch } from 'algoliasearch';
import { asc, sql } from 'drizzle-orm';
import {
  HeadwordDisplaySchema,
  toHeadwordRecord,
} from '@/lib/algolia/headwords';
import { drizzleDb } from '@/lib/db';
import { articles } from '@/lib/db/schema';
import { HeadwordSchema } from '@/lib/schemas';

const appId = process.env.ALGOLIA_APP_ID;
const writeApiKey = process.env.ALGOLIA_WRITE_API_KEY;
const indexName = 'headwords';
const tmpIndexName = `${indexName}_tmp`;
const pageSize = 5000;

if (!appId) {
  throw new Error('Missing ALGOLIA_APP_ID environment variable.');
}

if (!writeApiKey) {
  throw new Error('Missing ALGOLIA_WRITE_API_KEY environment variable.');
}

const client = algoliasearch(appId, writeApiKey);

// Reads only the fields a record needs, a page at a time, so the full
// articles never have to fit in memory.
async function* readRecords() {
  let cursor: { headword: string; variety: string } | undefined;

  while (true) {
    const rows = await drizzleDb
      .select({
        headword: articles.headword,
        variety: articles.variety,
        partOfSpeech: sql<
          string | null
        >`${articles.data} #>> '{etymons,0,lexemes,0,lexicalCategory}'`,
        pronunciation: sql<
          string | null
        >`${articles.data} #>> '{etymons,0,lexemes,0,transcription}'`,
        meaning: sql<
          string | null
        >`${articles.data} #>> '{etymons,0,lexemes,0,senses,0,definition}'`,
      })
      .from(articles)
      .where(
        cursor &&
          sql`(${articles.headword}, ${articles.variety}) > (${cursor.headword}, ${cursor.variety})`,
      )
      .orderBy(asc(articles.headword), asc(articles.variety))
      .limit(pageSize);

    if (rows.length === 0) return;

    yield rows.map((row) =>
      toHeadwordRecord(
        HeadwordSchema.parse({ form: row.headword, variety: row.variety }),
        HeadwordDisplaySchema.parse({
          partOfSpeech: row.partOfSpeech ?? undefined,
          pronunciation: row.pronunciation ?? undefined,
          meaning: row.meaning ?? undefined,
        }),
      ),
    );

    cursor = rows.at(-1);
  }
}

async function main() {
  const { taskID } = await client.setSettings({
    indexName,
    indexSettings: {
      searchableAttributes: ['headword'],
      attributesToRetrieve: [
        'headword',
        'variety',
        'url',
        'hasArticle',
        'display',
      ],
      attributesToHighlight: ['headword'],
    },
  });
  await client.waitForTask({ indexName, taskID });

  // Same approach as replaceAllObjects, but fed page by page: fill a copy of
  // the index, then swap it in atomically.
  const copy = await client.operationIndex({
    indexName,
    operationIndexParams: {
      operation: 'copy',
      destination: tmpIndexName,
      scope: ['settings', 'rules', 'synonyms'],
    },
  });
  await client.waitForTask({ indexName: tmpIndexName, taskID: copy.taskID });

  let count = 0;

  for await (const records of readRecords()) {
    await client.saveObjects({
      indexName: tmpIndexName,
      objects: records,
      waitForTasks: true,
    });
    count += records.length;
    console.log(`Indexed ${count} headword records…`);
  }

  const move = await client.operationIndex({
    indexName: tmpIndexName,
    operationIndexParams: { operation: 'move', destination: indexName },
  });
  await client.waitForTask({ indexName: tmpIndexName, taskID: move.taskID });

  console.log(`Reindexed ${count} headword records into ${indexName}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
