#!/usr/bin/env python3
"""Build an idempotent MariaDB migration from the D1 schema and export."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCE_SCHEMA = ROOT / "drizzle" / "0000_worthless_stellaris.sql"
SOURCE_DATA = Path(__file__).with_name("d1-export.production.json")
OUTPUT_SCHEMA = Path(__file__).with_name("mariadb-schema.sql")
OUTPUT_DATA = Path(__file__).with_name("mariadb-data.production.sql")

EXCLUDED_TABLES = {
    "sessions", "community_tokens", "password_reset_tokens",
    "online_visitors", "member_push_tokens", "job_alert_sent",
}


def sql_value(value: object) -> str:
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "1" if value else "0"
    if isinstance(value, (int, float)):
        return str(value)
    text = str(value).replace("\\", "\\\\").replace("'", "''")
    return "'" + text + "'"


def indexed_columns(source: str) -> set[tuple[str, str]]:
    found: set[tuple[str, str]] = set()
    for match in re.finditer(r"CREATE (?:UNIQUE )?INDEX `[^`]+` ON `([^`]+)` \(([^)]+)\)", source):
        table = match.group(1)
        for column in re.findall(r"`([^`]+)`", match.group(2)):
            found.add((table, column))
    return found


def convert_schema(source: str) -> str:
    indexed = indexed_columns(source)
    output = [
        "-- Generated from the production D1 schema. Isolated app database only.",
        "SET NAMES utf8mb4;",
        "SET FOREIGN_KEY_CHECKS=0;",
    ]
    current_table = ""
    for raw in source.replace("--> statement-breakpoint", "").splitlines():
        line = raw.rstrip()
        table_match = re.match(r"CREATE TABLE `([^`]+)`", line)
        if table_match:
            current_table = table_match.group(1)
            if current_table in EXCLUDED_TABLES:
                continue
            output.append(line.replace("CREATE TABLE", "CREATE TABLE IF NOT EXISTS", 1))
            continue
        if current_table in EXCLUDED_TABLES:
            if line == ");":
                current_table = ""
            continue
        index_match = re.match(r"CREATE (UNIQUE )?INDEX `([^`]+)` ON `([^`]+)`", line)
        if index_match:
            table = index_match.group(3)
            if table not in EXCLUDED_TABLES:
                unique = "UNIQUE " if index_match.group(1) else ""
                output.append(re.sub(r"^CREATE (?:UNIQUE )?INDEX", f"CREATE {unique}INDEX", line))
            continue
        column_match = re.match(r"(\s*)`([^`]+)` (integer|text)(.*?)(,?)$", line)
        if column_match and current_table:
            indent, column, kind, tail, comma = column_match.groups()
            is_pk = "PRIMARY KEY" in tail
            if kind == "integer":
                mysql_type = "BIGINT"
                tail = tail.replace("PRIMARY KEY AUTOINCREMENT", "UNSIGNED AUTO_INCREMENT PRIMARY KEY")
                tail = tail.replace("DEFAULT true", "DEFAULT 1").replace("DEFAULT false", "DEFAULT 0")
                tail = re.sub(r"DEFAULT \(unixepoch\(\) \* 1000\)", "DEFAULT 0", tail)
            else:
                short = is_pk or (current_table, column) in indexed or bool(re.search(r"DEFAULT '[^']*'", tail))
                mysql_type = "VARCHAR(191)" if short else "LONGTEXT"
                tail = tail.replace("DEFAULT (lower(hex(randomblob(16))))", "")
            output.append(f"{indent}`{column}` {mysql_type}{tail}{comma}")
            continue
        if line == ");":
            output.append(") CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
            current_table = ""
            continue
        if line:
            output.append(line)
    output.extend(["SET FOREIGN_KEY_CHECKS=1;", ""])
    return "\n".join(output)


def build_data(export: dict) -> str:
    lines = [
        "-- Production content export. Re-runnable through primary-key upserts.",
        "SET NAMES utf8mb4;",
        "SET FOREIGN_KEY_CHECKS=0;",
    ]
    for table in export["tables"]:
        name = table["table"]
        if name in EXCLUDED_TABLES or not table["rows"]:
            continue
        columns = table["columns"]
        quoted = ", ".join(f"`{column}`" for column in columns)
        updates = ", ".join(f"`{column}`=VALUES(`{column}`)" for column in columns)
        for row in table["rows"]:
            if isinstance(row, dict):
                values = [row.get(column) for column in columns]
            else:
                values = row
            encoded = ", ".join(sql_value(value) for value in values)
            lines.append(
                f"INSERT INTO `{name}` ({quoted}) VALUES ({encoded}) "
                f"ON DUPLICATE KEY UPDATE {updates};"
            )
    lines.extend(["SET FOREIGN_KEY_CHECKS=1;", ""])
    return "\n".join(lines)


def main() -> None:
    export = json.loads(SOURCE_DATA.read_text(encoding="utf-8"))
    OUTPUT_SCHEMA.write_text(convert_schema(SOURCE_SCHEMA.read_text(encoding="utf-8")), encoding="utf-8")
    OUTPUT_DATA.write_text(build_data(export), encoding="utf-8")
    row_count = sum(len(table["rows"]) for table in export["tables"] if table["table"] not in EXCLUDED_TABLES)
    print(f"Built MariaDB migration for {len(export['tables'])} tables and {row_count} rows")


if __name__ == "__main__":
    main()
