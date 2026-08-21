from __future__ import annotations

import json
import os
import posixpath
import stat
import sys
import time
from pathlib import Path, PurePosixPath

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR / ".site-packages"))

import paramiko  # noqa: E402


ROOT = SCRIPT_DIR.parent
BUILD_DIR = ROOT / "application" / "artifacts" / "alwdaif" / "dist" / "public"
HANDLER_DIR = SCRIPT_DIR / "public_html"
HANDLERS = [
    ".htaccess",
    "admin-auth.php",
    "admin-content.php",
    "community-auth.php",
    "community-api.php",
    "support-api.php",
    "orders-api.php",
    "search-api.php",
    "local-api.php",
    "runtime-api.php",
    "upload-handler.php",
    "index.php",
]


def credentials() -> dict[str, object]:
    required = {
        "host": os.environ.get("CLOUDWAYS_SFTP_HOST"),
        "port": os.environ.get("CLOUDWAYS_SFTP_PORT", "22"),
        "username": os.environ.get("CLOUDWAYS_SFTP_USERNAME"),
        "password": os.environ.get("CLOUDWAYS_SFTP_PASSWORD"),
    }
    if required["host"] and required["username"] and required["password"]:
        return required
    local = SCRIPT_DIR / ".secrets" / "sftp-credentials.json"
    if not local.is_file():
        raise RuntimeError("Cloudways SFTP credentials are not configured")
    return json.loads(local.read_text(encoding="utf-8"))


def connect() -> tuple[paramiko.SSHClient, paramiko.SFTPClient]:
    values = credentials()
    client = paramiko.SSHClient()
    client.load_system_host_keys()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(
        hostname=str(values["host"]),
        port=int(values.get("port", 22)),
        username=str(values["username"]),
        password=str(values["password"]),
        allow_agent=False,
        look_for_keys=False,
        timeout=30,
        banner_timeout=30,
        auth_timeout=30,
    )
    return client, client.open_sftp()


def ensure_dir(sftp: paramiko.SFTPClient, remote: PurePosixPath) -> None:
    current = PurePosixPath(".")
    for part in remote.parts:
        if part in ("", "."):
            continue
        current /= part
        try:
            info = sftp.stat(str(current))
            if not stat.S_ISDIR(info.st_mode):
                raise RuntimeError(f"Remote path is not a directory: {current}")
        except FileNotFoundError:
            sftp.mkdir(str(current))


def upload_atomic(sftp: paramiko.SFTPClient, local: Path, remote: PurePosixPath) -> None:
    ensure_dir(sftp, remote.parent)
    temporary = PurePosixPath(str(remote) + ".codex-new")
    sftp.put(str(local), str(temporary))
    try:
        sftp.posix_rename(str(temporary), str(remote))
    except OSError:
        try:
            sftp.remove(str(remote))
        except FileNotFoundError:
            pass
        sftp.rename(str(temporary), str(remote))


def backup_remote(sftp: paramiko.SFTPClient, source: PurePosixPath, destination: PurePosixPath) -> None:
    try:
        sftp.stat(str(source))
    except FileNotFoundError:
        return
    ensure_dir(sftp, destination.parent)
    with sftp.open(str(source), "rb") as reader, sftp.open(str(destination), "wb") as writer:
        while True:
            block = reader.read(1024 * 1024)
            if not block:
                break
            writer.write(block)


def main() -> int:
    if not (BUILD_DIR / "index.html").is_file():
        raise RuntimeError(f"Frontend build is missing: {BUILD_DIR}")
    missing = [name for name in HANDLERS if not (HANDLER_DIR / name).is_file()]
    if missing:
        raise RuntimeError(f"Cloudways handlers are missing: {', '.join(missing)}")

    release = time.strftime("%Y%m%d-%H%M%S", time.gmtime())
    client, sftp = connect()
    uploaded = 0
    uploaded_bytes = 0
    try:
        backup_root = PurePosixPath("private_html") / "releases" / release / "public_html"
        for name in HANDLERS:
            backup_remote(sftp, PurePosixPath("public_html") / name, backup_root / name)
        backup_remote(sftp, PurePosixPath("public_html/spa-index.html"), backup_root / "spa-index.html")

        # Hashed assets and public files are safe to publish before activation.
        for local in sorted(BUILD_DIR.rglob("*")):
            if not local.is_file() or local.name == "index.html":
                continue
            relative = PurePosixPath(*local.relative_to(BUILD_DIR).parts)
            upload_atomic(sftp, local, PurePosixPath("public_html") / relative)
            uploaded += 1
            uploaded_bytes += local.stat().st_size

        upload_atomic(sftp, BUILD_DIR / "index.html", PurePosixPath("public_html/spa-index.html"))
        uploaded += 1
        uploaded_bytes += (BUILD_DIR / "index.html").stat().st_size

        # Activate helpers first and the front controller last.
        for name in [item for item in HANDLERS if item != "index.php"] + ["index.php"]:
            local = HANDLER_DIR / name
            upload_atomic(sftp, local, PurePosixPath("public_html") / name)
            uploaded += 1
            uploaded_bytes += local.stat().st_size

        print(json.dumps({
            "release": release,
            "uploaded_files": uploaded,
            "uploaded_bytes": uploaded_bytes,
            "rollback_path": str(backup_root),
        }))
        return 0
    finally:
        sftp.close()
        client.close()


if __name__ == "__main__":
    raise SystemExit(main())
