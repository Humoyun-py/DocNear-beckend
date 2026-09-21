import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../models/models.dart';

String readableError(Object error) {
  final value = error.toString();
  final clean = value.replaceFirst('ApiException: ', '');
  if (clean.contains('SocketException') || clean.contains('connection')) {
    return 'Serverga ulanib bo‘lmadi. Internet va API manzilini tekshiring.';
  }
  return clean;
}

class AsyncPane<T> extends StatelessWidget {
  const AsyncPane({
    required this.value,
    required this.builder,
    required this.onRetry,
    this.empty,
    super.key,
  });
  final AsyncSnapshot<T> value;
  final Widget Function(T data) builder;
  final VoidCallback onRetry;
  final bool Function(T data)? empty;

  @override
  Widget build(BuildContext context) {
    if (value.connectionState == ConnectionState.waiting) {
      return const LoadingCards();
    }
    if (value.hasError) {
      return ErrorState(message: readableError(value.error!), onRetry: onRetry);
    }
    final data = value.data as T;
    if (empty?.call(data) ?? false) return const EmptyState();
    return builder(data);
  }
}

class LoadingCards extends StatelessWidget {
  const LoadingCards({this.count = 4, super.key});
  final int count;
  @override
  Widget build(BuildContext context) => ListView.separated(
    padding: const EdgeInsets.all(20),
    itemCount: count,
    separatorBuilder: (_, __) => const SizedBox(height: 12),
    itemBuilder: (_, __) => Container(
      height: 112,
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(20),
      ),
    ),
  );
}

class ErrorState extends StatelessWidget {
  const ErrorState({required this.message, required this.onRetry, super.key});
  final String message;
  final VoidCallback onRetry;
  @override
  Widget build(BuildContext context) => Center(
    child: Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            LucideIcons.wifiOff,
            size: 44,
            color: Theme.of(context).colorScheme.error,
          ),
          const SizedBox(height: 16),
          Text(message, textAlign: TextAlign.center),
          const SizedBox(height: 20),
          OutlinedButton.icon(
            onPressed: onRetry,
            icon: const Icon(LucideIcons.refreshCw),
            label: const Text('Qayta urinish'),
          ),
        ],
      ),
    ),
  );
}

class EmptyState extends StatelessWidget {
  const EmptyState({
    this.title = 'Hozircha ma’lumot yo‘q',
    this.message = 'Yangilab yana tekshirib ko‘ring.',
    super.key,
  });
  final String title;
  final String message;
  @override
  Widget build(BuildContext context) => Center(
    child: Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(LucideIcons.inbox, size: 48),
          const SizedBox(height: 14),
          Text(title, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 6),
          Text(message, textAlign: TextAlign.center),
        ],
      ),
    ),
  );
}

class NetworkImageBox extends StatelessWidget {
  const NetworkImageBox(
    this.url, {
    this.size = 64,
    this.radius = 16,
    super.key,
  });
  final String? url;
  final double size;
  final double radius;
  @override
  Widget build(BuildContext context) {
    if (url == null || url!.isEmpty) {
      return Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.primaryContainer,
          borderRadius: BorderRadius.circular(radius),
        ),
        child: Icon(
          LucideIcons.stethoscope,
          color: Theme.of(context).colorScheme.primary,
        ),
      );
    }
    return ClipRRect(
      borderRadius: BorderRadius.circular(radius),
      child: CachedNetworkImage(
        imageUrl: url!,
        width: size,
        height: size,
        fit: BoxFit.cover,
        placeholder: (_, __) => Container(
          color: Theme.of(context).colorScheme.surfaceContainerHighest,
        ),
        errorWidget: (_, __, ___) => const Icon(LucideIcons.imageOff),
      ),
    );
  }
}

class VerifiedBadge extends StatelessWidget {
  const VerifiedBadge({this.label = 'Tasdiqlangan', super.key});
  final String label;
  @override
  Widget build(BuildContext context) => DecoratedBox(
    decoration: BoxDecoration(
      color: Theme.of(context).colorScheme.secondaryContainer,
      borderRadius: BorderRadius.circular(8),
    ),
    child: Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(LucideIcons.shieldCheck, size: 14),
          const SizedBox(width: 5),
          Text(label, style: Theme.of(context).textTheme.labelSmall),
        ],
      ),
    ),
  );
}

class RatingLine extends StatelessWidget {
  const RatingLine(this.rating, {this.distance, super.key});
  final double rating;
  final double? distance;
  @override
  Widget build(BuildContext context) => Row(
    children: [
      const Icon(LucideIcons.star, size: 16, color: Color(0xFFE5A216)),
      const SizedBox(width: 5),
      Text(rating.toStringAsFixed(1)),
      if (distance != null) ...[
        const SizedBox(width: 14),
        const Icon(LucideIcons.mapPin, size: 16),
        const SizedBox(width: 4),
        Text('${distance!.toStringAsFixed(1)} km'),
      ],
    ],
  );
}

class ClinicCard extends StatelessWidget {
  const ClinicCard(this.clinic, {super.key});
  final ClinicModel clinic;
  @override
  Widget build(BuildContext context) => Card(
    child: InkWell(
      borderRadius: BorderRadius.circular(20),
      onTap: () => context.push('/clinics/${clinic.id}'),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            NetworkImageBox(clinic.logo),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          clinic.name,
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                      ),
                      if (clinic.verifiedPartner)
                        const Icon(
                          LucideIcons.badgeCheck,
                          size: 18,
                          color: Color(0xFF22A06B),
                        ),
                    ],
                  ),
                  const SizedBox(height: 5),
                  Text(
                    clinic.address,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 9),
                  RatingLine(clinic.rating, distance: clinic.distanceKm),
                  const SizedBox(height: 8),
                  Text(
                    '${clinic.doctorCount} shifokor',
                    style: Theme.of(context).textTheme.labelMedium,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    ),
  );
}

class DoctorCard extends StatelessWidget {
  const DoctorCard(this.doctor, {super.key});
  final DoctorModel doctor;
  @override
  Widget build(BuildContext context) => Card(
    child: InkWell(
      borderRadius: BorderRadius.circular(20),
      onTap: () => context.push('/doctors/${doctor.id}'),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            NetworkImageBox(doctor.profileImage, radius: 32),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          doctor.name,
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                      ),
                      if (doctor.verified)
                        const Icon(
                          LucideIcons.badgeCheck,
                          size: 18,
                          color: Color(0xFF22A06B),
                        ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(doctor.specialty),
                  if (doctor.clinicName.isNotEmpty)
                    Text(
                      doctor.clinicName,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  const SizedBox(height: 8),
                  RatingLine(doctor.rating, distance: doctor.distanceKm),
                ],
              ),
            ),
          ],
        ),
      ),
    ),
  );
}

Color appointmentStatusColor(String status) => switch (status) {
  'confirmed' => const Color(0xFF16875D),
  'cancelled' || 'rejected' => const Color(0xFFB42318),
  'completed' => const Color(0xFF475467),
  _ => const Color(0xFFB54708),
};

class AppointmentCard extends StatelessWidget {
  const AppointmentCard(this.appointment, {super.key});
  final AppointmentModel appointment;
  @override
  Widget build(BuildContext context) => Card(
    child: InkWell(
      borderRadius: BorderRadius.circular(20),
      onTap: () => context.push('/appointments/${appointment.id}'),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    appointment.doctorName,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ),
                DecoratedBox(
                  decoration: BoxDecoration(
                    color: appointmentStatusColor(
                      appointment.status,
                    ).withValues(alpha: .12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 9,
                      vertical: 5,
                    ),
                    child: Text(
                      appointment.status,
                      style: TextStyle(
                        color: appointmentStatusColor(appointment.status),
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 5),
            Text(appointment.clinicName),
            const SizedBox(height: 14),
            Row(
              children: [
                const Icon(LucideIcons.calendarDays, size: 17),
                const SizedBox(width: 6),
                Text(appointment.date),
                const SizedBox(width: 18),
                const Icon(LucideIcons.clock3, size: 17),
                const SizedBox(width: 6),
                Text(appointment.startTime),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              'Booking ID: ${appointment.bookingId}',
              style: Theme.of(context).textTheme.labelMedium,
            ),
          ],
        ),
      ),
    ),
  );
}

class SectionTitle extends StatelessWidget {
  const SectionTitle(this.title, {this.action, super.key});
  final String title;
  final Widget? action;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(20, 18, 20, 10),
    child: Row(
      children: [
        Expanded(
          child: Text(
            title,
            style: Theme.of(
              context,
            ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
          ),
        ),
        if (action != null) action!,
      ],
    ),
  );
}
