from __future__ import annotations

import argparse
import json
import os
import stat
import sys
import zipfile
from pathlib import Path, PurePosixPath

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR / ".site-packages"))

import paramiko  # noqa: E402


def load_credentials() -> dict[str, object]:
    credential_path = SCRIPT_DIR / ".secrets" / "sftp-credentials.json"
    return json.loads(credential_path.read_text(encoding="utf-8"))


def connect() -> tuple[paramiko.SSHClient, paramiko.SFTPClient]:
    credentials = load_credentials()
    client = paramiko.SSHClient()
    client.load_system_host_keys()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(
        hostname=str(credentials["host"]),
        port=int(credentials.get("port", 22)),
        username=str(credentials["username"]),
        password=str(credentials["password"]),
        allow_agent=False,
        look_for_keys=False,
        timeout=15,
    )
    return client, client.open_sftp()


def list_scope(sftp: paramiko.SFTPClient, path: str = ".") -> list[dict[str, object]]:
    result: list[dict[str, object]] = []
    for item in sftp.listdir_attr(path):
        result.append(
            {
                "name": item.filename,
                "directory": stat.S_ISDIR(item.st_mode),
                "size": item.st_size,
            }
        )
    return sorted(result, key=lambda item: str(item["name"]))


def ensure_remote_directory(
    sftp: paramiko.SFTPClient,
    path: PurePosixPath,
    known_directories: set[PurePosixPath],
) -> None:
    current = PurePosixPath(".")
    for part in path.parts:
        if part in ("", "."):
            continue
        current = current / part
        if current in known_directories:
            continue
        try:
            details = sftp.stat(str(current))
            if not stat.S_ISDIR(details.st_mode):
                raise RuntimeError(f"Remote path is not a directory: {current}")
        except FileNotFoundError:
            sftp.mkdir(str(current))
        known_directories.add(current)


def deploy_zip(sftp: paramiko.SFTPClient, archive_path: Path) -> tuple[int, int]:
    uploaded_files = 0
    uploaded_bytes = 0
    destination = PurePosixPath("public_html")
    known_directories = {PurePosixPath(".")}
    ensure_remote_directory(sftp, destination, known_directories)

    with zipfile.ZipFile(archive_path) as archive:
        for entry in archive.infolist():
            relative = PurePosixPath(entry.filename)
            if relative.is_absolute() or ".." in relative.parts:
                raise RuntimeError(f"Unsafe archive entry: {entry.filename}")
            remote_path = destination / relative
            if entry.is_dir():
                ensure_remote_directory(sftp, remote_path, known_directories)
                continue
            ensure_remote_directory(sftp, remote_path.parent, known_directories)
            with archive.open(entry) as source, sftp.file(str(remote_path), "wb") as target:
                while chunk := source.read(1024 * 1024):
                    target.write(chunk)
                    uploaded_bytes += len(chunk)
            uploaded_files += 1

    return uploaded_files, uploaded_bytes


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--deploy", action="store_true")
    args = parser.parse_args()

    client, sftp = connect()
    try:
        scope = list_scope(sftp)
        public_entries = list_scope(sftp, "public_html")
        print(
            json.dumps(
                {
                    "remote_root": sftp.getcwd(),
                    "entries": scope,
                    "public_html": public_entries,
                },
                ensure_ascii=False,
            )
        )
        if not args.deploy:
            return 0
        archive_path = SCRIPT_DIR / "cloudways-deploy.zip"
        count, size = deploy_zip(sftp, archive_path)
        print(json.dumps({"uploaded_files": count, "uploaded_bytes": size}))
        return 0
    finally:
        sftp.close()
        client.close()


if __name__ == "__main__":
    raise SystemExit(main())
