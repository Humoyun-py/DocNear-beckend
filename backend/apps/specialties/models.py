from django.db import models
from common.models import TimestampedModel
from common.validators import icon_name


class Specialty(TimestampedModel):
    name = models.CharField(max_length=120)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    icon_name = models.CharField(max_length=50, default="stethoscope", validators=[icon_name])
    search_aliases = models.CharField(max_length=500, blank=True, help_text="Localized search terms, e.g. kardi kardiolog")
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name
