from rest_framework.renderers import JSONRenderer


class EnvelopeRenderer(JSONRenderer):
    def render(self, data, accepted_media_type=None, renderer_context=None):
        response = (renderer_context or {}).get("response")
        if response and response.status_code == 204:
            return b""
        if not isinstance(data, dict) or "success" not in data:
            data = {"success": True, "data": data}
        return super().render(data, accepted_media_type, renderer_context)
