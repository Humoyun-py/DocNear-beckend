from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("accounts", "0002_phoneotp")]

    operations = [
        migrations.CreateModel(
            name="TelegramAuthHandoff",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("token_hash", models.CharField(max_length=64, unique=True)),
                ("phone_number", models.CharField(max_length=16)),
                ("purpose", models.CharField(choices=[("login", "login"), ("register", "register")], max_length=10)),
                ("first_name", models.CharField(blank=True, max_length=100)),
                ("last_name", models.CharField(blank=True, max_length=100)),
                ("expires_at", models.DateTimeField(db_index=True)),
                ("used_at", models.DateTimeField(blank=True, null=True)),
                ("telegram_user_id", models.BigIntegerField(blank=True, db_index=True, null=True)),
                ("telegram_chat_id", models.BigIntegerField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={"ordering": ["-created_at"]},
        ),
    ]
