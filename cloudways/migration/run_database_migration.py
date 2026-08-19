#!/usr/bin/env python3
"""Upload, run, validate, and remove the one-time Cloudways DB importer."""

from __future__ import annotations

import json
import secrets
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "cloudways" / ".site-packages"))
import paramiko  # noqa: E402

MIGRATION = Path(__file__).resolve().parent
SFTP_SECRET = ROOT / "cloudways" / ".secrets" / "sftp-credentials.json"
DB_SECRET = ROOT / "cloudways" / ".secrets" / "database-credentials.json"
BASE_URL = "https://phpstack-564460-6624296.cloudwaysapps.com"


def php_string(value: str) -> str:
    return "'" + value.replace("\\", "\\\\").replace("'", "\\'") + "'"


def request_json(url: str, token: str) -> dict:
    request = urllib.request.Request(url, headers={"X-Migration-Token": token, "Accept": "application/json"})
    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Importer returned HTTP {error.code}: {body}") from error


def main() -> None:
    sftp_credentials = json.loads(SFTP_SECRET.read_text(encoding="utf-8"))
    database = json.loads(DB_SECRET.read_text(encoding="utf-8"))
    token = secrets.token_urlsafe(36)
    importer_name = f"_alwdaif_migrate_{secrets.token_hex(8)}.php"
    remote_importer = f"public_html/{importer_name}"
    config = "<?php\nreturn [\n" + "".join(
        f"    {php_string(key)} => {value if isinstance(value, int) else php_string(str(value))},\n"
        for key, value in {**database, "token": token}.items()
    ) + "];\n"

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(
        sftp_credentials["host"],
        port=sftp_credentials.get("port", 22),
        username=sftp_credentials["username"],
        password=sftp_credentials["password"],
        timeout=20,
    )
    sftp = client.open_sftp()
    try:
        with sftp.file("private_html/alwdaif-migration-config.php", "w") as remote:
            remote.write(config)
        sftp.chmod("private_html/alwdaif-migration-config.php", 0o600)
        sftp.put(str(MIGRATION / "mariadb-schema.sql"), "private_html/mariadb-schema.sql")
        sftp.put(str(MIGRATION / "d1-export.production.json"), "private_html/d1-export.production.json")
        sftp.put(str(MIGRATION / "import.php"), remote_importer)

        inspect = request_json(f"{BASE_URL}/{importer_name}?action=inspect", token)
        print(json.dumps({"phase": "inspect", **inspect}, ensure_ascii=False))
        if not inspect.get("ok"):
            raise RuntimeError("Database preflight failed")
        if inspect.get("tableCount") and not inspect.get("managed"):
            reset = request_json(f"{BASE_URL}/{importer_name}?action=reset-partial", token)
            print(json.dumps({"phase": "reset-partial", **reset}, ensure_ascii=False))
            if not reset.get("ok"):
                raise RuntimeError("Partial migration cleanup failed")
        install = request_json(f"{BASE_URL}/{importer_name}?action=install", token)
        print(json.dumps({"phase": "install", **install}, ensure_ascii=False))
        if not install.get("ok"):
            raise RuntimeError("Database import failed")
    finally:
        try:
            sftp.remove(remote_importer)
        except OSError:
            pass
        sftp.close()
        client.close()


if __name__ == "__main__":
    main()
