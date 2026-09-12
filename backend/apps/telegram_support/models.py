import secrets
from django.conf import settings
from django.db import models


class TelegramLink(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    telegram_user_id = models.BigIntegerField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)


def link_code():
    return secrets.token_urlsafe(32)


class TelegramLinkCode(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    code = models.CharField(max_length=100, unique=True, default=link_code)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True)


class TelegramPhoneLink(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="telegram_phone_link")
    phone_number = models.CharField(max_length=16, unique=True)
    telegram_user_id = models.BigIntegerField(unique=True)
    telegram_chat_id = models.BigIntegerField(unique=True)
    is_active = models.BooleanField(default=True)
    linked_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
