typedef Json = Map<String, dynamic>;

int asInt(Object? value) => value is int ? value : int.tryParse('$value') ?? 0;
double asDouble(Object? value) =>
    value is num ? value.toDouble() : double.tryParse('$value') ?? 0;
bool asBool(Object? value) => value == true;
String asString(Object? value) => value?.toString() ?? '';
Json asJson(Object? value) =>
    value is Map ? Map<String, dynamic>.from(value) : <String, dynamic>{};
List<Json> asJsonList(Object? value) => value is List
    ? value.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
    : const [];

class ApiResponseModel<T> {
  const ApiResponseModel({required this.success, this.data, this.message});
  final bool success;
  final T? data;
  final String? message;
}

class PaginatedResponseModel<T> {
  const PaginatedResponseModel({
    required this.count,
    required this.results,
    this.next,
    this.previous,
  });
  final int count;
  final List<T> results;
  final String? next;
  final String? previous;
}

class UserModel {
  const UserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.firstName,
    required this.lastName,
    required this.role,
    this.profileImage,
  });
  final int id;
  final String name;
  final String email;
  final String phone;
  final String firstName;
  final String lastName;
  final String role;
  final String? profileImage;
  String get displayName {
    final fullName = '$firstName $lastName'.trim();
    return fullName.isNotEmpty ? fullName : (name.isNotEmpty ? name : email);
  }

  factory UserModel.fromJson(Json json) => UserModel(
    id: asInt(json['id']),
    name: asString(json['name']),
    email: asString(json['email']),
    phone: asString(json['phone_number']),
    firstName: asString(json['first_name']),
    lastName: asString(json['last_name']),
    role: asString(json['role']),
    profileImage: json['profile_image']?.toString(),
  );
}

class SpecialtyModel {
  const SpecialtyModel({
    required this.id,
    required this.name,
    this.description = '',
  });
  final int id;
  final String name;
  final String description;
  factory SpecialtyModel.fromJson(Json json) => SpecialtyModel(
    id: asInt(json['id']),
    name: asString(json['name']),
    description: asString(json['description']),
  );
}

class ClinicServiceModel {
  const ClinicServiceModel({
    required this.id,
    required this.name,
    this.description = '',
  });
  final int id;
  final String name;
  final String description;
  factory ClinicServiceModel.fromJson(Json json) => ClinicServiceModel(
    id: asInt(json['id']),
    name: asString(json['name']),
    description: asString(json['description']),
  );
}

class DoctorAffiliationModel {
  const DoctorAffiliationModel({
    required this.clinicId,
    required this.clinicName,
    required this.specialtyId,
    required this.specialtyName,
    this.latitude,
    this.longitude,
  });
  final int clinicId;
  final String clinicName;
  final int specialtyId;
  final String specialtyName;
  final double? latitude;
  final double? longitude;
  factory DoctorAffiliationModel.fromJson(Json json) => DoctorAffiliationModel(
    clinicId: asInt(json['clinic']),
    clinicName: asString(json['clinic_name']),
    specialtyId: asInt(json['specialty']),
    specialtyName: asString(json['specialty_name']),
    latitude: json['latitude'] == null ? null : asDouble(json['latitude']),
    longitude: json['longitude'] == null ? null : asDouble(json['longitude']),
  );
}

class DoctorModel {
  const DoctorModel({
    required this.id,
    required this.name,
    required this.bio,
    required this.experienceYears,
    required this.rating,
    required this.totalReviews,
    required this.verified,
    required this.active,
    required this.acceptsBookings,
    required this.affiliations,
    this.profileImage,
    this.education = '',
    this.certifications = const [],
    this.languages = const [],
    this.distanceKm,
    this.nextAvailableTime,
  });
  final int id;
  final String name;
  final String bio;
  final int experienceYears;
  final double rating;
  final int totalReviews;
  final bool verified;
  final bool active;
  final bool acceptsBookings;
  final List<DoctorAffiliationModel> affiliations;
  final String? profileImage;
  final String education;
  final List<String> certifications;
  final List<String> languages;
  final double? distanceKm;
  final String? nextAvailableTime;
  String get specialty =>
      affiliations.isEmpty ? 'Mutaxassis' : affiliations.first.specialtyName;
  String get clinicName =>
      affiliations.isEmpty ? '' : affiliations.first.clinicName;
  int? get primaryClinicId =>
      affiliations.isEmpty ? null : affiliations.first.clinicId;
  factory DoctorModel.fromJson(Json json) => DoctorModel(
    id: asInt(json['id']),
    name: asString(json['name']),
    bio: asString(json['bio']),
    experienceYears: asInt(json['experience_years']),
    rating: asDouble(json['rating']),
    totalReviews: asInt(json['total_reviews']),
    verified: asBool(json['is_verified']),
    active: asBool(json['is_active']),
    acceptsBookings: asBool(json['accepts_bookings']),
    affiliations: asJsonList(
      json['affiliations'],
    ).map(DoctorAffiliationModel.fromJson).toList(),
    profileImage: json['profile_image']?.toString(),
    education: asString(json['education']),
    certifications:
        (json['certifications'] is List
                ? json['certifications'] as List
                : const [])
            .map(asString)
            .toList(),
    languages:
        (json['languages'] is List ? json['languages'] as List : const [])
            .map(asString)
            .toList(),
    distanceKm: json['distance_km'] == null
        ? null
        : asDouble(json['distance_km']),
    nextAvailableTime: json['next_available_time']?.toString(),
  );
}

class ClinicModel {
  const ClinicModel({
    required this.id,
    required this.name,
    required this.description,
    required this.phone,
    required this.email,
    required this.address,
    required this.latitude,
    required this.longitude,
    required this.verifiedPartner,
    required this.verified,
    required this.partner,
    required this.active,
    required this.is247,
    required this.hasEmergencyService,
    required this.rating,
    required this.doctorCount,
    required this.open,
    required this.services,
    required this.workingHours,
    required this.images,
    this.logo,
    this.coverImage,
    this.distanceKm,
    this.nextAvailableTime,
    this.doctors = const [],
  });
  final int id;
  final String name;
  final String description;
  final String phone;
  final String email;
  final String address;
  final double latitude;
  final double longitude;
  final bool verifiedPartner;
  final bool verified;
  final bool partner;
  final bool active;
  final bool is247;
  final bool hasEmergencyService;
  final double rating;
  final int doctorCount;
  final bool open;
  final List<ClinicServiceModel> services;
  final Json workingHours;
  final List<Json> images;
  final String? logo;
  final String? coverImage;
  final double? distanceKm;
  final String? nextAvailableTime;
  final List<DoctorModel> doctors;
  factory ClinicModel.fromJson(Json json) => ClinicModel(
    id: asInt(json['id']),
    name: asString(json['name']),
    description: asString(json['description']),
    phone: asString(json['phone']),
    email: asString(json['email']),
    address: asString(json['address']),
    latitude: asDouble(json['latitude']),
    longitude: asDouble(json['longitude']),
    verifiedPartner:
        asBool(json['verified_partner']) ||
        (asBool(json['is_verified']) && asBool(json['is_partner'])),
    verified: asBool(json['is_verified']),
    partner: asBool(json['is_partner']),
    active: asBool(json['is_active']),
    is247: asBool(json['is_24_7']),
    hasEmergencyService: asBool(json['has_emergency_service']),
    rating: asDouble(json['rating']),
    doctorCount: asInt(json['doctor_count']),
    open: asBool(json['open_status']),
    services: asJsonList(
      json['services'],
    ).map(ClinicServiceModel.fromJson).toList(),
    workingHours: asJson(json['working_hours']),
    images: asJsonList(json['images']),
    logo: json['logo']?.toString(),
    coverImage: json['cover_image']?.toString(),
    distanceKm: json['distance_km'] == null
        ? null
        : asDouble(json['distance_km']),
    nextAvailableTime: json['next_available_time']?.toString(),
    doctors: asJsonList(json['doctors']).map(DoctorModel.fromJson).toList(),
  );
}

class TimeSlotModel {
  const TimeSlotModel({
    required this.time,
    required this.endTime,
    required this.available,
  });
  final String time;
  final String endTime;
  final bool available;
  factory TimeSlotModel.fromJson(Json json) => TimeSlotModel(
    time: asString(json['time']),
    endTime: asString(json['end_time']),
    available: asBool(json['available']),
  );
}

class AvailabilityResponseModel {
  const AvailabilityResponseModel({
    required this.date,
    required this.doctor,
    required this.clinicId,
    required this.clinicName,
    required this.slots,
  });
  final String date;
  final DoctorModel doctor;
  final int clinicId;
  final String clinicName;
  final List<TimeSlotModel> slots;
  factory AvailabilityResponseModel.fromJson(Json json) {
    final clinic = asJson(json['clinic']);
    return AvailabilityResponseModel(
      date: asString(json['date']),
      doctor: DoctorModel.fromJson(asJson(json['doctor'])),
      clinicId: asInt(clinic['id']),
      clinicName: asString(clinic['name']),
      slots: asJsonList(json['slots']).map(TimeSlotModel.fromJson).toList(),
    );
  }
}

class AppointmentModel {
  const AppointmentModel({
    required this.id,
    required this.bookingId,
    required this.patientId,
    required this.patientName,
    required this.doctorId,
    required this.doctorName,
    required this.clinicId,
    required this.clinicName,
    required this.specialtyId,
    required this.specialtyName,
    required this.date,
    required this.startTime,
    required this.endTime,
    required this.status,
    required this.patientNote,
    required this.cancelReason,
    required this.createdAt,
    required this.updatedAt,
  });
  final int id;
  final String bookingId;
  final int patientId;
  final String patientName;
  final int doctorId;
  final String doctorName;
  final int clinicId;
  final String clinicName;
  final int specialtyId;
  final String specialtyName;
  final String date;
  final String startTime;
  final String endTime;
  final String status;
  final String patientNote;
  final String cancelReason;
  final String createdAt;
  final String updatedAt;
  bool get isUpcoming =>
      !{'completed', 'cancelled', 'rejected', 'no_show'}.contains(status);
  factory AppointmentModel.fromJson(Json json) => AppointmentModel(
    id: asInt(json['id']),
    bookingId: asString(json['booking_id']),
    patientId: asInt(json['patient']),
    patientName: asString(json['patient_name']),
    doctorId: asInt(json['doctor']),
    doctorName: asString(json['doctor_name']),
    clinicId: asInt(json['clinic']),
    clinicName: asString(json['clinic_name']),
    specialtyId: asInt(json['specialty']),
    specialtyName: asString(json['specialty_name']),
    date: asString(json['appointment_date']),
    startTime: asString(json['start_time']),
    endTime: asString(json['end_time']),
    status: asString(json['status']),
    patientNote: asString(json['patient_note']),
    cancelReason: asString(json['cancel_reason']),
    createdAt: asString(json['created_at']),
    updatedAt: asString(json['updated_at']),
  );
}

typedef FavoriteDoctorModel = DoctorModel;
typedef FavoriteClinicModel = ClinicModel;

class ReviewModel {
  const ReviewModel({
    required this.id,
    required this.doctorId,
    required this.clinicId,
    required this.rating,
    required this.comment,
    required this.createdAt,
  });
  final int id;
  final int doctorId;
  final int clinicId;
  final int rating;
  final String comment;
  final String createdAt;
  factory ReviewModel.fromJson(Json json) => ReviewModel(
    id: asInt(json['id']),
    doctorId: asInt(json['doctor']),
    clinicId: asInt(json['clinic']),
    rating: asInt(json['rating']),
    comment: asString(json['comment']),
    createdAt: asString(json['created_at']),
  );
}

class NotificationModel {
  const NotificationModel({
    required this.id,
    required this.type,
    required this.title,
    required this.message,
    required this.isRead,
    required this.createdAt,
  });
  final int id;
  final String type;
  final String title;
  final String message;
  final bool isRead;
  final String createdAt;
  factory NotificationModel.fromJson(Json json) => NotificationModel(
    id: asInt(json['id']),
    type: asString(json['type']),
    title: asString(json['title']),
    message: asString(json['message']),
    isRead: asBool(json['is_read']),
    createdAt: asString(json['created_at']),
  );
}

class SearchResultModel {
  const SearchResultModel({
    required this.doctors,
    required this.clinics,
    required this.specialties,
  });
  final List<DoctorModel> doctors;
  final List<ClinicModel> clinics;
  final List<SpecialtyModel> specialties;
  factory SearchResultModel.fromJson(Json json) => SearchResultModel(
    doctors: asJsonList(json['doctors']).map(DoctorModel.fromJson).toList(),
    clinics: asJsonList(json['clinics']).map(ClinicModel.fromJson).toList(),
    specialties: asJsonList(
      json['specialties'],
    ).map(SpecialtyModel.fromJson).toList(),
  );
}
