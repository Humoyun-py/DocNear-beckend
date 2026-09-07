from django.conf import settings
from django.contrib.auth.backends import ModelBackend
from .models import User


class IdentifierBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        identifier = username or kwargs.get("phone_number") or kwargs.get("email") or ""
        is_email = "@" in identifier
        if (settings.AUTH_LOGIN_MODE == "phone" and is_email) or (settings.AUTH_LOGIN_MODE == "email" and not is_email):
            User().set_password(password)
            return None
        try:
            user = User.objects.get(**({"email__iexact": identifier} if is_email else {"phone_number": identifier}))
        except User.DoesNotExist:
            User().set_password(password)
            return None
        if user.check_password(password) and self.user_can_authenticate(user):
            return user
