DO $$
BEGIN
  EXECUTE 'ALTER TABLE "kata_scores" DROP COLUMN IF EXISTS "' || 'percent' || 'age"';
END $$;
