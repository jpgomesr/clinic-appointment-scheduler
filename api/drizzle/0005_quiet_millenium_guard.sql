-- appointments_no_overlap usa tsrange(start_at, end_at), incompatível com
-- timestamptz; precisa ser removida antes do ALTER e recriada com tstzrange
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_no_overlap";--> statement-breakpoint

-- USING ... AT TIME ZONE 'UTC' reinterpreta os valores já gravados como UTC
-- (suposição que o app sempre fez), em vez de depender do TimeZone de sessão
ALTER TABLE "appointments" ALTER COLUMN "start_at" SET DATA TYPE timestamp with time zone USING "start_at" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "end_at" SET DATA TYPE timestamp with time zone USING "end_at" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "deleted_at" SET DATA TYPE timestamp with time zone USING "deleted_at" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "deleted_at" SET DATA TYPE timestamp with time zone USING "deleted_at" AT TIME ZONE 'UTC';--> statement-breakpoint

ALTER TABLE "appointments"
ADD CONSTRAINT "appointments_no_overlap"
EXCLUDE USING gist (
  -- Tratando via gist apenas inserts que possuem o professional_id
  -- igual ao informado ao tentar setar esse range de horário
  professional_id WITH =,
  -- Criando range half-open entre 2 horários [09:00, 10:00) para validação
  -- half-open: [) informa que pode existir outro registro que comece com o
  -- mesmo valor final de outro apontamento, ex: [09:00, 10:00) e [10:00, 11:00)
  tstzrange(start_at, end_at) WITH &&
)
WHERE (deleted_at IS NULL);
