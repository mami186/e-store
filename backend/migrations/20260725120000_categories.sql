-- Create "categories" table
CREATE TABLE "public"."categories" ("id" serial NOT NULL, "name" character varying(100) NOT NULL, "slug" character varying(120) NOT NULL, "description" text NULL, "parent_id" integer NULL, "is_active" boolean NOT NULL, "created_at" timestamptz NOT NULL, "updated_at" timestamptz NOT NULL, PRIMARY KEY ("id"), CONSTRAINT "categories_slug_key" UNIQUE ("slug"), CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."categories" ("id") ON UPDATE NO ACTION ON DELETE SET NULL);
-- Create index "ix_categories_slug" to table: "categories"
CREATE UNIQUE INDEX "ix_categories_slug" ON "public"."categories" ("slug");
-- Alter "products" table: add "category_id" column, drop "category" column
ALTER TABLE "public"."products" DROP COLUMN "category";
ALTER TABLE "public"."products" ADD COLUMN "category_id" integer NULL;
ALTER TABLE "public"."products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories" ("id") ON UPDATE NO ACTION ON DELETE SET NULL;
