$ErrorActionPreference = "Stop"

$sourceRoot = Join-Path $PSScriptRoot "..\db\legacy-schema"
$targetRoot = Join-Path $PSScriptRoot "..\db\schema"
New-Item -ItemType Directory -Force -Path (Join-Path $targetRoot "models") | Out-Null

function Convert-SchemaFile([string]$source, [string]$target) {
  $content = [IO.File]::ReadAllText($source)
  $content = $content -replace 'import \{ pgTable, text, varchar, serial, timestamp, boolean, integer, unique, index \} from "drizzle-orm/pg-core";', 'import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";'
  $content = $content -replace 'import \{ index, jsonb, pgTable, timestamp, varchar \} from "drizzle-orm/pg-core";', 'import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";'
  $content = $content -replace '\bpgTable\(', 'sqliteTable('
  $content = [regex]::Replace($content, 'serial\(([^\)]+)\)\.primaryKey\(\)', 'integer($1).primaryKey({ autoIncrement: true })')
  $content = [regex]::Replace($content, 'varchar\(("[^"]+")(?:, \{ length: \d+ \})?\)', 'text($1)')
  $content = [regex]::Replace($content, 'timestamp\(("[^"]+")\)', 'integer($1, { mode: "timestamp_ms" })')
  $content = [regex]::Replace($content, 'boolean\(("[^"]+")\)', 'integer($1, { mode: "boolean" })')
  $content = $content -replace '\.defaultNow\(\)', '.default(sql`(unixepoch() * 1000)`)'
  $content = [regex]::Replace($content, 'text\(("categories")\)\.array\(\)', 'text($1, { mode: "json" }).$type<string[]>()')
  $content = [regex]::Replace($content, 'jsonb\(("[^"]+")\)', 'text($1, { mode: "json" })')
  $content = $content -replace 'default\(sql`gen_random_uuid\(\)`\)', 'default(sql`(lower(hex(randomblob(16))))`)'
  [IO.File]::WriteAllText($target, $content, [Text.UTF8Encoding]::new($false))
}

Convert-SchemaFile (Join-Path $sourceRoot "schema.ts") (Join-Path $targetRoot "schema.ts")
Convert-SchemaFile (Join-Path $sourceRoot "models\auth.ts") (Join-Path $targetRoot "models\auth.ts")
[IO.File]::WriteAllText((Join-Path $targetRoot "index.ts"), "export * from `"./schema`";`n", [Text.UTF8Encoding]::new($false))
