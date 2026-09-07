from drf_spectacular.extensions import OpenApiAuthenticationExtension


class TelegramAuthenticationScheme(OpenApiAuthenticationExtension):
    target_class = 'apps.telegram_support.authentication.TelegramAuthentication'
    name = ['TelegramBotSecret', 'TelegramLinkedUser']

    def get_security_definition(self, auto_schema):
        return [
            {'type':'apiKey', 'in':'header', 'name':'X-Telegram-Bot-Secret', 'description':'Server-side bot secret; never ship in a patient client.'},
            {'type':'apiKey', 'in':'header', 'name':'X-Telegram-User-Id', 'description':'Telegram ID of the patient linked by a one-time code.'},
        ]
