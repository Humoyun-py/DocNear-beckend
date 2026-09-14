# PostgreSQL backup and restore

Use encrypted storage and a service account with the smallest required access.
Do not put dumps in the repository or in a public media bucket.

```bash
# backup (run on the database host or through a private tunnel)
pg_dump --format=custom --no-owner --dbname="$DATABASE_URL" \
  | age -r "$BACKUP_AGE_RECIPIENT" > docnear-$(date -u +%Y%m%dT%H%M%SZ).dump.age

# restore into a new, empty verification database
age -d -i /etc/docnear/backup-key.txt docnear-YYYYMMDDTHHMMSSZ.dump.age \
  | pg_restore --clean --if-exists --no-owner --dbname="$RESTORE_DATABASE_URL"
python backend/manage.py migrate --noinput --settings=config.settings.production
```

Verify row counts, health, login, booking visibility and media references in the
isolated restore environment. Keep at least daily backups with an encrypted,
off-host copy and a documented retention period. Before rollback, pause writes if
the release changed schema; restore the previous application image, then migrate
forward only after the backup is verified.
