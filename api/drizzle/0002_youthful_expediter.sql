CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE "appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"start_at" timestamp NOT NULL,
	"end_at" timestamp NOT NULL,
	"professional_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_professional_id_professionals_id_fk" FOREIGN KEY ("professional_id") REFERENCES "public"."professionals"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "appointments"
ADD CONSTRAINT "appointments_no_overlap"
EXCLUDE USING gist (
  -- Tratando via gist apenas inserts que possuem o professional_id 
  -- igual ao informado ao tentar setar esse range de horário
  professional_id WITH =,
  -- Criando range half-open entre 2 horários [09:00, 10:00) para validação
  -- half-open: [) informa que pode existir outro registro que comece com o
  -- mesmo valor final de outro apontamento, ex: [09:00, 10:00) e [10:00, 11:00)
  tsrange(start_at, end_at) WITH &&
)
WHERE (deleted_at IS NULL);	