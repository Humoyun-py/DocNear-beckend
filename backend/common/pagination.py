from rest_framework.pagination import PageNumberPagination
from .security import security_event


class Pagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100

    def get_page_size(self, request):
        raw = request.query_params.get(self.page_size_query_param)
        try:
            if raw is not None and int(raw) > self.max_page_size:
                security_event("page_size_capped", request, requested="over_limit", limit=self.max_page_size)
        except (TypeError, ValueError):
            pass
        return super().get_page_size(request)
