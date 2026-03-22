import { zodTextFormat } from 'openai/helpers/zod';
import { ArticleSchema, QueryValidationSchema } from '../lib/schemas';

const schemas = {
  article: zodTextFormat(ArticleSchema, 'article'),
  query_validation: zodTextFormat(QueryValidationSchema, 'query_validation'),
};

const name = process.argv[2];

if (!name || !(name in schemas)) {
  console.error(`Usage: pnpm oai:schema <${Object.keys(schemas).join(' | ')}>`);
  process.exit(1);
}

console.log(JSON.stringify(schemas[name as keyof typeof schemas], null, 2));
