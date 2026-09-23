CREATE TABLE "professionals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL
);

INSERT INTO "professionals" ("name")
VALUES
    ('Dr. João Silva'),
    ('Dra. Maria Oliveira'),
    ('Dr. Carlos Souza'),
    ('Dra. Ana Costa'),
    ('Dr. Rafael Martins');
