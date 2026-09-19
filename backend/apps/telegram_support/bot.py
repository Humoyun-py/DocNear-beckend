"""Telegram polling bot for secure phone linking and OTP requests."""

import json
import time
from urllib import error, request

from apps.accounts.phone import normalize_phone_number

NOT_LINKED_MESSAGE = "Avval telefon raqamingizni ulashing. Buning uchun /link_phone buyrug‘idan foydalaning."
ACCOUNT_UNAVAILABLE_MESSAGE = "Bu raqamga DocNear hisobi topilmadi. Ro‘yxatdan o‘tish kodi uchun /code register buyrug‘idan foydalaning."
REGISTER_FROM_APP_MESSAGE = (
    "Ro‘yxatdan o‘tish uchun DocNear ilovasi yoki saytida Ro‘yxatdan o‘tish sahifasidan boshlang."
)
ACCOUNT_ALREADY_EXISTS_MESSAGE = (
    "Bu telefon raqami bilan hisob allaqachon mavjud.\n"
    "DocNear sayt yoki ilovasidagi Kirish sahifasidan foydalaning."
)


class BotServiceError(RuntimeError):
    def __init__(self, message: str, code: str = ""):
        super().__init__(message)
        self.code = code


class TelegramApi:
    def __init__(self, token: str):
        self._base_url = f"https://api.telegram.org/bot{token}/"

    def _call(self, method: str, payload: dict) -> dict:
        body = json.dumps(payload).encode()
        req = request.Request(
            self._base_url + method,
            data=body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with request.urlopen(req, timeout=40) as response:  # noqa: S310 - fixed Telegram API host
                result = json.load(response)
        except (error.URLError, TimeoutError, ValueError):
            # Telegram embeds the token in the request URL, so never chain the
            # transport exception into logs or command output.
            raise BotServiceError("Telegram serveri bilan bog‘lanib bo‘lmadi.") from None
        if not result.get("ok"):
            raise BotServiceError("Telegram so‘rovni qabul qilmadi.")
        return result.get("result")

    def get_updates(self, offset: int, timeout: int) -> list[dict]:
        return self._call("getUpdates", {"offset": offset, "timeout": timeout, "allowed_updates": ["message"]})

    def get_me(self) -> dict:
        return self._call("getMe", {})

    def get_webhook_info(self) -> dict:
        return self._call("getWebhookInfo", {})

    def delete_webhook(self, *, drop_pending_updates: bool = False) -> None:
        self._call("deleteWebhook", {"drop_pending_updates": drop_pending_updates})

    def send_text(self, chat_id: int, text: str, reply_markup: dict | None = None) -> None:
        payload = {"chat_id": chat_id, "text": text}
        if reply_markup:
            payload["reply_markup"] = reply_markup
        self._call("sendMessage", payload)


class BackendClient:
    def __init__(self, base_url: str, secret: str):
        self.base_url = base_url.rstrip("/")
        self.secret = secret

    def _request(self, path: str, payload: dict, method: str = "POST") -> dict:
        req = request.Request(
            self.base_url + path,
            data=json.dumps(payload).encode(),
            headers={
                "Accept": "application/json",
                "Content-Type": "application/json",
                "X-Telegram-Bot-Secret": self.secret,
            },
            method=method,
        )
        try:
            with request.urlopen(req, timeout=15) as response:  # noqa: S310 - operator-configured DocNear API
                result = json.load(response)
        except error.HTTPError as exc:
            try:
                result = json.load(exc)
            except (ValueError, AttributeError):
                result = {}
            raise BotServiceError(result.get("message", "So‘rov bajarilmadi."), result.get("code", "")) from exc
        except (error.URLError, TimeoutError, ValueError) as exc:
            raise BotServiceError("DocNear serveri bilan bog‘lanib bo‘lmadi. Keyinroq qayta urinib ko‘ring.") from exc
        if result.get("success") is False:
            raise BotServiceError(result.get("message", "So‘rov bajarilmadi."), result.get("code", ""))
        return result.get("data", result)

    def link_phone(self, payload: dict) -> dict:
        return self._request("/telegram/phone-link/", payload)

    def request_code(self, telegram_user_id: int, purpose: str) -> dict:
        return self._request(
            "/telegram/request-otp/",
            {"telegram_user_id": telegram_user_id, "purpose": purpose},
        )

    def claim_handoff(self, token: str, telegram_user_id: int, telegram_chat_id: int) -> dict:
        return self._request("/telegram/handoff/claim/", {
            "token": token,
            "telegram_user_id": telegram_user_id,
            "telegram_chat_id": telegram_chat_id,
        })

    def complete_handoff(self, payload: dict) -> dict:
        return self._request("/telegram/handoff/complete/", payload)

    def unlink(self, telegram_user_id: int) -> dict:
        return self._request("/telegram/phone-link/", {"telegram_user_id": telegram_user_id}, "DELETE")


def normalize_phone(value: str) -> str:
    try:
        return normalize_phone_number(value)
    except ValueError as exc:
        raise BotServiceError(str(exc)) from None


class DocNearTelegramBot:
    def __init__(self, telegram: TelegramApi, backend: BackendClient):
        self.telegram = telegram
        self.backend = backend
        self.pending_handoffs: dict[tuple[int, int], dict] = {}

    @staticmethod
    def contact_keyboard() -> dict:
        return {
            "keyboard": [[{"text": "Telefon raqamni yuborish", "request_contact": True}]],
            "resize_keyboard": True,
            "one_time_keyboard": True,
        }

    def handle_update(self, update: dict) -> None:
        message = update.get("message") or {}
        sender = message.get("from") or {}
        chat = message.get("chat") or {}
        if not sender.get("id") or not chat.get("id"):
            return
        if chat.get("type", "private") != "private" or chat["id"] != sender["id"]:
            return
        if message.get("contact"):
            self._handle_contact(message, sender, chat)
            return
        text = (message.get("text") or "").strip()
        if not text:
            return
        command, *arguments = text.split()
        command = command.split("@", 1)[0].lower()
        handlers = {
            "/start": self._start,
            "/link_phone": self._link_phone,
            "/code": self._code,
            "/unlink": self._unlink,
            "/help": self._help,
        }
        handler = handlers.get(command)
        if handler:
            handler(chat["id"], sender["id"], arguments)
        else:
            self.telegram.send_text(chat["id"], "Mavjud buyruqlarni ko‘rish uchun /help buyrug‘ini yuboring.")

    def _start(self, chat_id: int, telegram_user_id: int, arguments: list[str]) -> None:
        if arguments:
            try:
                handoff = self.backend.claim_handoff(arguments[0], telegram_user_id, chat_id)
            except BotServiceError as exc:
                self.telegram.send_text(chat_id, str(exc))
                return
            self.pending_handoffs[(telegram_user_id, chat_id)] = handoff
            self.telegram.send_text(
                chat_id,
                "DocNear'da davom etish uchun telefon raqamingizni yuboring.",
                self.contact_keyboard(),
            )
            return
        self.telegram.send_text(
            chat_id,
            "DocNear botiga xush kelibsiz.\n"
            "Davom etish uchun quyidagi tugma orqali telefon raqamingizni yuboring.",
            self.contact_keyboard(),
        )

    def _link_phone(self, chat_id: int, telegram_user_id: int, arguments: list[str]) -> None:
        del telegram_user_id, arguments
        self.telegram.send_text(
            chat_id,
            "Quyidagi tugma orqali o‘zingizga tegishli telefon kontaktini yuboring.",
            self.contact_keyboard(),
        )

    def _handle_contact(self, message: dict, sender: dict, chat: dict) -> None:
        contact = message["contact"]
        if contact.get("user_id") != sender["id"]:
            self.telegram.send_text(chat["id"], "Faqat o‘zingizga tegishli kontaktni ulashingiz mumkin.")
            return
        try:
            phone_number = normalize_phone(contact.get("phone_number", ""))
            pending_handoff = self.pending_handoffs.get((sender["id"], chat["id"]))
            if pending_handoff and phone_number != pending_handoff["phone_number"]:
                self.telegram.send_text(
                    chat["id"],
                    "Sayt yoki ilovada kiritilgan telefon raqamiga tegishli kontaktni yuboring.",
                )
                return
            payload = {
                "phone_number": phone_number,
                "telegram_user_id": sender["id"],
                "telegram_chat_id": chat["id"],
                "contact_user_id": contact["user_id"],
                "sender_user_id": sender["id"],
            }
            try:
                handoff = self.backend.complete_handoff(payload)
            except BotServiceError as handoff_exc:
                if handoff_exc.code == "account_already_exists":
                    self.pending_handoffs.pop((sender["id"], chat["id"]), None)
                    self.telegram.send_text(chat["id"], ACCOUNT_ALREADY_EXISTS_MESSAGE, {"remove_keyboard": True})
                    return
                if pending_handoff or handoff_exc.code != "telegram_handoff_not_found":
                    raise
                handoff = None
            if handoff:
                if pending_handoff and handoff["purpose"] != pending_handoff["purpose"]:
                    raise BotServiceError("Tasdiqlash maqsadi mos kelmadi. Jarayonni qaytadan boshlang.")
                self.pending_handoffs.pop((sender["id"], chat["id"]), None)
                success_message = (
                    "Telefon raqamingiz tasdiqlandi.\nKirish kodi Telegram orqali yuborildi."
                    if handoff["purpose"] == "login"
                    else "Telefon raqamingiz tasdiqlandi.\nRo'yxatdan o'tish kodi Telegram orqali yuborildi."
                )
                self.telegram.send_text(chat["id"], success_message, {"remove_keyboard": True})
                return
            self.backend.link_phone(payload)
        except BotServiceError as exc:
            self.telegram.send_text(chat["id"], str(exc))
            return
        purpose = "login"
        try:
            self.backend.request_code(sender["id"], purpose)
        except BotServiceError as exc:
            message = REGISTER_FROM_APP_MESSAGE if exc.code in {
                "account_not_found", "telegram_account_unavailable",
            } else str(exc)
            self.telegram.send_text(chat["id"], message, {"remove_keyboard": True})
            return
        self.telegram.send_text(
            chat["id"],
            "Telefon raqamingiz tasdiqlandi.\nKirish kodi Telegram orqali yuborildi.",
            {"remove_keyboard": True},
        )

    def _code(self, chat_id: int, telegram_user_id: int, arguments: list[str]) -> None:
        purpose = "register" if arguments and arguments[0].lower() == "register" else "login"
        try:
            self.backend.request_code(telegram_user_id, purpose)
        except BotServiceError as exc:
            if exc.code == "telegram_not_linked":
                message = NOT_LINKED_MESSAGE
            elif exc.code == "telegram_account_unavailable":
                message = ACCOUNT_UNAVAILABLE_MESSAGE
            else:
                message = str(exc)
            self.telegram.send_text(chat_id, message)
            return
        self.telegram.send_text(
            chat_id,
            "Tasdiqlash kodi Telegram orqali yuborildi.",
        )

    def _unlink(self, chat_id: int, telegram_user_id: int, arguments: list[str]) -> None:
        del arguments
        try:
            self.backend.unlink(telegram_user_id)
        except BotServiceError as exc:
            self.telegram.send_text(chat_id, str(exc))
            return
        self.telegram.send_text(chat_id, "Telefon raqamingiz Telegram botdan uzildi.")

    def _help(self, chat_id: int, telegram_user_id: int, arguments: list[str]) -> None:
        del telegram_user_id, arguments
        self.telegram.send_text(
            chat_id,
            "/start - telefon raqamingizni yuborish va kodni avtomatik olish\n"
            "/unlink - bog‘lanishni o‘chirish\n"
            "/help - yordam\n\n"
            "Kirish uchun /start buyrug‘i yetarli. Ro‘yxatdan o‘tishni DocNear sayti yoki mobil "
            "ilovasidagi Ro‘yxatdan o‘tish sahifasidan boshlang.",
        )

    def poll(self, timeout: int = 30, once: bool = False) -> None:
        offset = 0
        while True:
            try:
                updates = self.telegram.get_updates(offset, timeout)
                for update in updates:
                    offset = max(offset, int(update["update_id"]) + 1)
                    self.handle_update(update)
            except BotServiceError:
                if once:
                    raise
                time.sleep(3)
            if once:
                return
