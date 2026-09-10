import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../app/data_providers.dart';
import '../../../core/providers.dart';
import '../../../shared/widgets/app_widgets.dart';

class ClinicDetailsScreen extends ConsumerWidget {
  const ClinicDetailsScreen({required this.id, super.key});
  final int id;
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final value = ref.watch(clinicDetailsProvider(id));
    return Scaffold(
      appBar: AppBar(
        title: const Text('Klinika'),
        actions: [
          IconButton(
            tooltip: 'Sevimlilarga qo‘shish',
            onPressed: () async {
              await ref.read(favoriteRepositoryProvider).setClinic(id, true);
              ref.invalidate(favoriteClinicsProvider);
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Klinika sevimlilarga qo‘shildi'),
                  ),
                );
              }
            },
            icon: const Icon(LucideIcons.heart),
          ),
        ],
      ),
      body: value.when(
        loading: () => const LoadingCards(),
        error: (error, _) => ErrorState(
          message: readableError(error),
          onRetry: () => ref.invalidate(clinicDetailsProvider(id)),
        ),
        data: (clinic) => ListView(
          padding: const EdgeInsets.only(bottom: 32),
          children: [
            if (clinic.coverImage != null && clinic.coverImage!.isNotEmpty)
              NetworkImageBox(clinic.coverImage, size: 230, radius: 0),
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      NetworkImageBox(clinic.logo, size: 72, radius: 22),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              clinic.name,
                              style: Theme.of(context).textTheme.headlineSmall
                                  ?.copyWith(fontWeight: FontWeight.w900),
                            ),
                            const SizedBox(height: 7),
                            if (clinic.verifiedPartner)
                              const VerifiedBadge(label: 'Hamkor klinika'),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),
                  Row(
                    children: [
                      RatingLine(clinic.rating, distance: clinic.distanceKm),
                      const Spacer(),
                      Text(
                        clinic.open ? 'Ochiq' : 'Yopiq',
                        style: TextStyle(
                          fontWeight: FontWeight.w800,
                          color: clinic.open
                              ? const Color(0xFF16875D)
                              : Theme.of(context).colorScheme.error,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: clinic.phone.isEmpty
                              ? null
                              : () => launchUrl(
                                  Uri(scheme: 'tel', path: clinic.phone),
                                ),
                          icon: const Icon(LucideIcons.phone),
                          label: const Text('Qo‘ng‘iroq'),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () => launchUrl(
                            Uri.parse(
                              'https://www.google.com/maps/search/?api=1&query=${clinic.latitude},${clinic.longitude}',
                            ),
                          ),
                          icon: const Icon(LucideIcons.navigation),
                          label: const Text('Yo‘nalish'),
                        ),
                      ),
                    ],
                  ),
                  const SectionTitle('Klinika haqida'),
                  Text(
                    clinic.description.isEmpty
                        ? 'Klinika haqida ma’lumot kiritilmagan.'
                        : clinic.description,
                  ),
                  const SizedBox(height: 15),
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: const Icon(LucideIcons.mapPin),
                    title: const Text('Manzil'),
                    subtitle: Text(clinic.address),
                  ),
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: const Icon(LucideIcons.clock3),
                    title: const Text('Ish vaqti'),
                    subtitle: Text(
                      clinic.is247
                          ? '24/7 ochiq'
                          : clinic.workingHours.isEmpty
                          ? 'Jadval ko‘rsatilmagan'
                          : 'Haftalik jadval mavjud',
                    ),
                  ),
                  if (clinic.services.isNotEmpty) ...[
                    const SectionTitle('Xizmatlar'),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: clinic.services
                          .map((item) => Chip(label: Text(item.name)))
                          .toList(),
                    ),
                  ],
                  const SectionTitle('Shifokorlar'),
                  if (clinic.doctors.isEmpty)
                    const SizedBox(
                      height: 150,
                      child: EmptyState(
                        title: 'Shifokorlar topilmadi',
                        message: 'Klinika ro‘yxati keyinroq yangilanadi.',
                      ),
                    )
                  else
                    for (final doctor in clinic.doctors) ...[
                      DoctorCard(doctor),
                      const SizedBox(height: 12),
                    ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class DoctorDetailsScreen extends ConsumerWidget {
  const DoctorDetailsScreen({required this.id, super.key});
  final int id;
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final value = ref.watch(doctorDetailsProvider(id));
    return Scaffold(
      appBar: AppBar(
        title: const Text('Shifokor profili'),
        actions: [
          IconButton(
            tooltip: 'Sevimlilarga qo‘shish',
            onPressed: () async {
              await ref.read(favoriteRepositoryProvider).setDoctor(id, true);
              ref.invalidate(favoriteDoctorsProvider);
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Shifokor sevimlilarga qo‘shildi'),
                  ),
                );
              }
            },
            icon: const Icon(LucideIcons.heart),
          ),
        ],
      ),
      bottomNavigationBar: value.valueOrNull == null
          ? null
          : SafeArea(
              minimum: const EdgeInsets.all(16),
              child: FilledButton.icon(
                onPressed:
                    value.valueOrNull!.acceptsBookings &&
                        value.valueOrNull!.primaryClinicId != null
                    ? () => context.push(
                        '/booking/${value.valueOrNull!.id}/${value.valueOrNull!.primaryClinicId}',
                      )
                    : null,
                icon: const Icon(LucideIcons.calendarPlus),
                label: const Text('Uchrashuvga yozilish'),
              ),
            ),
      body: value.when(
        loading: () => const LoadingCards(),
        error: (error, _) => ErrorState(
          message: readableError(error),
          onRetry: () => ref.invalidate(doctorDetailsProvider(id)),
        ),
        data: (doctor) => ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Center(
              child: NetworkImageBox(
                doctor.profileImage,
                size: 112,
                radius: 56,
              ),
            ),
            const SizedBox(height: 18),
            Text(
              doctor.name,
              textAlign: TextAlign.center,
              style: Theme.of(
                context,
              ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 5),
            Text(doctor.specialty, textAlign: TextAlign.center),
            const SizedBox(height: 10),
            if (doctor.verified)
              const Align(alignment: Alignment.center, child: VerifiedBadge()),
            const SizedBox(height: 18),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _stat(
                      context,
                      LucideIcons.star,
                      doctor.rating.toStringAsFixed(1),
                      '${doctor.totalReviews} sharh',
                    ),
                    _stat(
                      context,
                      LucideIcons.briefcase,
                      '${doctor.experienceYears}',
                      'yil tajriba',
                    ),
                    _stat(
                      context,
                      LucideIcons.building2,
                      doctor.affiliations.length.toString(),
                      'klinika',
                    ),
                  ],
                ),
              ),
            ),
            const SectionTitle('Shifokor haqida'),
            Text(doctor.bio.isEmpty ? 'Ma’lumot kiritilmagan.' : doctor.bio),
            if (doctor.education.isNotEmpty) ...[
              const SectionTitle('Ta’lim'),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(LucideIcons.graduationCap),
                title: Text(doctor.education),
              ),
            ],
            if (doctor.certifications.isNotEmpty) ...[
              const SectionTitle('Sertifikatlar'),
              for (final item in doctor.certifications)
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(LucideIcons.award),
                  title: Text(item),
                ),
            ],
            if (doctor.languages.isNotEmpty) ...[
              const SectionTitle('Tillar'),
              Wrap(
                spacing: 8,
                children: doctor.languages
                    .map((item) => Chip(label: Text(item)))
                    .toList(),
              ),
            ],
            const SectionTitle('Klinikalar va mutaxassisliklar'),
            for (final item in doctor.affiliations)
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(LucideIcons.building2),
                title: Text(item.clinicName),
                subtitle: Text(item.specialtyName),
                trailing: const Icon(LucideIcons.chevronRight),
                onTap: () => context.push('/clinics/${item.clinicId}'),
              ),
            const SectionTitle('Sharhlar'),
            Text(
              '${doctor.totalReviews} ta tasdiqlangan sharh asosida reyting.',
            ),
          ],
        ),
      ),
    );
  }

  Widget _stat(
    BuildContext context,
    IconData icon,
    String value,
    String label,
  ) => Column(
    children: [
      Icon(icon, color: Theme.of(context).colorScheme.primary),
      const SizedBox(height: 7),
      Text(value, style: const TextStyle(fontWeight: FontWeight.w900)),
      Text(label, style: Theme.of(context).textTheme.bodySmall),
    ],
  );
}
