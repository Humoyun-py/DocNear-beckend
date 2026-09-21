# PostgreSQL Test Database

Django reads `DATABASE_URL` from the process environment or the external file
selected by `DOCNEAR_ENV_FILE`. Keep that file outside the repository. When a
custom URL is not set, the default role is `docnear` and the test database is
`test_docnear`.

Grant the role permission to create test databases as a PostgreSQL administrator:

```sql
ALTER ROLE docnear CREATEDB;
```

Equivalent command-line form:

```bash
sudo -u postgres psql -c "ALTER ROLE docnear CREATEDB;"
```

If `test_docnear` already exists from an interrupted run, either reuse it:

```bash
.venv/bin/pytest --keepdb -q
```

or drop it as a PostgreSQL administrator before a clean run:

```bash
sudo -u postgres dropdb --if-exists test_docnear
.venv/bin/pytest -q
```

For a non-default `DATABASE_URL`, replace `docnear` with the username parsed from that URL. Do not commit database passwords or production connection strings.
