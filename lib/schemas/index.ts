export {
  SenseSchema,
  LexicalCategorySchema,
  TranscriptionSchema,
  LexemeSchema,
  EtymonSchema,
  type Sense,
  type LexicalCategory,
  type Transcription,
  type Lexeme,
  type Etymon,
} from './etymon';
export { ArticleSchema, type Article } from './article';
export { VarietySchema, slugToVariety, type Variety } from './variety';
export { HeadwordSchema, type Headword } from './headword';
export {
  EditedArticleSchema,
  EditedEtymonSchema,
  EditedLexemeSchema,
  EditedSenseSchema,
  type EditedArticle,
  type EditedEtymon,
  type EditedLexeme,
  type EditedSense,
  type EditStreamMessage,
} from './edited-article';
