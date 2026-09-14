"""Exercise fresh-checkout QA secret setup without starting Postgres or Django."""

from pathlib import Path
import shutil
import stat
import subprocess
import sys

import pytest


@pytest.fixture
def qa_runner(tmp_path, monkeypatch):
    project = tmp_path / "project"
    for directory in ["scripts", "backend", ".venv/bin", "fake-pg"]:
        (project / directory).mkdir(parents=True)
    source = Path(__file__).resolve().parents[2] / "scripts/run-integration-qa.sh"
    runner = project / "scripts/run-integration-qa.sh"
    shutil.copyfile(source, runner)
    python = project / ".venv/bin/python"
    python.write_text(
        f"#!{sys.executable}\n"
        "import os, pathlib, sys\n"
        "if sys.argv[1] == '-':\n"
        "    sys.argv = sys.argv[1:]\n"
        "    exec(compile(sys.stdin.read(), '<qa-secret-bootstrap>', 'exec'))\n"
        "else:\n"
        "    assert 'DOCNEAR_ENV_FILE' not in os.environ\n"
        "    if 'runserver' in sys.argv: assert '127.0.0.1:8001' in sys.argv\n"
        "    path = pathlib.Path(os.environ['DOCNEAR_QA_RUNTIME_DIR']) / 'telegram-secret'\n"
        "    assert os.environ['TELEGRAM_BOT_SECRET'] == path.read_text()\n"
        "    assert len(path.read_text()) >= 40\n"
    )
    python.chmod(0o700)
    for name in ["initdb", "pg_ctl", "psql", "createdb"]:
        executable = project / "fake-pg" / name
        executable.write_text(
            "#!/bin/bash\n"
            'case "${0##*/}" in\n'
            '  initdb) mkdir -p "$2"; touch "$2/PG_VERSION" ;;\n'
            "  psql) printf '1\\n' ;;\n"
            "esac\n"
            "exit 0\n"
        )
        executable.chmod(0o700)
    monkeypatch.setenv("PG_BIN", str(project / "fake-pg"))
    monkeypatch.setenv("DOCNEAR_ENV_FILE", "/nonexistent/development.env")
    monkeypatch.delenv("DOCNEAR_QA_PORT", raising=False)
    return runner, project / ".runtime/integration/telegram-secret"


def test_qa_runner_creates_private_secret_on_first_run_and_reuses_it(qa_runner):
    runner, secret_file = qa_runner
    first = subprocess.run(["bash", str(runner)], capture_output=True, text=True, timeout=10)
    assert first.returncode == 0, first.stderr
    secret = secret_file.read_text()
    assert len(secret) >= 40
    assert stat.S_IMODE(secret_file.stat().st_mode) == 0o600
    assert stat.S_IMODE(secret_file.parent.stat().st_mode) == 0o700
    assert secret not in first.stdout + first.stderr

    secret_file.chmod(0o644)
    second = subprocess.run(["bash", str(runner)], capture_output=True, text=True, timeout=10)
    assert second.returncode == 0, second.stderr
    assert secret_file.read_text() == secret
    assert stat.S_IMODE(secret_file.stat().st_mode) == 0o600
    assert secret not in second.stdout + second.stderr


def test_qa_runner_rejects_existing_empty_secret(qa_runner):
    runner, secret_file = qa_runner
    secret_file.parent.mkdir(parents=True)
    secret_file.touch()
    result = subprocess.run(["bash", str(runner)], capture_output=True, text=True, timeout=10)
    assert result.returncode != 0
    assert "QA Telegram secret is empty" in result.stderr
    assert secret_file.read_text() == ""
