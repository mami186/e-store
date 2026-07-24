env "local" {
  url = "postgres://postgres@localhost:5432/estore?sslmode=disable"
  migration_dir = "file://migrations"
  dev = "docker://postgres/15/dev?search_path=public"
}
