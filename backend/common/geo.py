import math
from django.db.models import F, FloatField, Value, ExpressionWrapper
from django.db.models.functions import ACos, Cos, Sin, Radians, Least, Greatest
from rest_framework import serializers


class NearbyQuerySerializer(serializers.Serializer):
    latitude = serializers.FloatField(min_value=-90, max_value=90)
    longitude = serializers.FloatField(min_value=-180, max_value=180)
    radius = serializers.FloatField(min_value=0.1, max_value=100, default=5)

    def validate(self, attrs):
        if not all(math.isfinite(v) for v in attrs.values()):
            raise serializers.ValidationError("Coordinates and radius must be finite numbers.")
        return attrs


def nearby(queryset, params, prefix=""):
    serializer = NearbyQuerySerializer(data=params)
    serializer.is_valid(raise_exception=True)
    lat, lon, radius = (serializer.validated_data[k] for k in ("latitude", "longitude", "radius"))
    lat_field, lon_field = f"{prefix}latitude", f"{prefix}longitude"
    lat_delta = radius / 110.574
    queryset = queryset.filter(**{f"{lat_field}__gte": max(-90, lat - lat_delta), f"{lat_field}__lte": min(90, lat + lat_delta)})
    cosine = Sin(Radians(F(lat_field))) * math.sin(math.radians(lat)) + Cos(Radians(F(lat_field))) * math.cos(math.radians(lat)) * Cos(Radians(F(lon_field)) - math.radians(lon))
    distance = ExpressionWrapper(Value(6371.0088) * ACos(Least(Value(1.0), Greatest(Value(-1.0), cosine))), output_field=FloatField())
    return queryset.annotate(distance_km=distance).filter(distance_km__lte=radius).order_by("distance_km", "-rating", "pk")
