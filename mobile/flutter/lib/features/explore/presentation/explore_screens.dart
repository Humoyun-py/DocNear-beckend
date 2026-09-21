import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../app/data_providers.dart';
import '../../../core/config/app_config.dart';
import '../../../core/providers.dart';
import '../../../shared/models/models.dart';
import '../../../shared/widgets/app_widgets.dart';
import '../../auth/presentation/auth_controller.dart';

class AppShell extends StatelessWidget {
  const AppShell({required this.location, required this.child, super.key});
  final String location;
  final Widget child;

  static const destinations = [
    ('/', 'Bosh sahifa', LucideIcons.home),
    ('/search', 'Qidiruv', LucideIcons.search),
    ('/map', 'Xarita', LucideIcons.map),
    ('/appointments', 'Uchrashuvlar', LucideIcons.calendarDays),
    ('/profile', 'Profil', LucideIcons.userCircle),
  ];

  @override
  Widget build(BuildContext context) {
    var selected = destinations.indexWhere(
      (item) => item.$1 == '/' ? location == '/' : location.startsWith(item.$1),
    );
    if (selected < 0) selected = 0;
    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: selected,
        onDestinationSelected: (index) => context.go(destinations[index].$1),
        destinations: [
          for (final item in destinations)
            NavigationDestination(icon: Icon(item.$3), label: item.$2),
        ],
      ),
    );
  }
}

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final clinics = ref.watch(nearbyClinicsProvider);
    final doctors = ref.watch(doctorsProvider);
    final specialties = ref.watch(specialtiesProvider);
    final appointments = ref.watch(appointmentsProvider);
    final notifications = ref.watch(notificationsProvider);
    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(nearbyClinicsProvider);
        ref.invalidate(doctorsProvider);
        ref.invalidate(specialtiesProvider);
        ref.invalidate(appointmentsProvider);
        ref.invalidate(notificationsProvider);
        await ref.read(nearbyClinicsProvider.future);
      },
      child: CustomScrollView(
        slivers: [
          SliverAppBar(
            floating: true,
            title: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'DOCNEAR',
                  style: TextStyle(
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.4,
                  ),
                ),
                Text(
                  'Salom, ${user?.firstName.isNotEmpty == true ? user!.firstName : 'bemor'}',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
            actions: [
              IconButton(
                tooltip: 'Favqulodda klinikalar',
                onPressed: () => context.push('/emergency'),
                icon: const Icon(LucideIcons.siren),
              ),
              Badge(
                isLabelVisible:
                    notifications.valueOrNull?.any(
                      (notification) => !notification.isRead,
                    ) ==
                    true,
                child: IconButton(
                  tooltip: 'Bildirishnomalar',
                  onPressed: () => context.push('/notifications'),
                  icon: const Icon(LucideIcons.bell),
                ),
              ),
            ],
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 10, 20, 2),
            sliver: SliverToBoxAdapter(
              child: TextField(
                readOnly: true,
                onTap: () => context.go('/search'),
                decoration: const InputDecoration(
                  hintText: 'Shifokor, klinika yoki mutaxassislik',
                  prefixIcon: Icon(LucideIcons.search),
                ),
              ),
            ),
          ),
          const SliverToBoxAdapter(child: SectionTitle('Mutaxassisliklar')),
          SliverToBoxAdapter(
            child: SizedBox(
              height: 78,
              child: specialties.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (_, __) =>
                    const Center(child: Text('Mutaxassisliklar yuklanmadi')),
                data: (items) => ListView.separated(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  scrollDirection: Axis.horizontal,
                  itemCount: items.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 10),
                  itemBuilder: (_, index) => ActionChip(
                    avatar: const Icon(LucideIcons.stethoscope, size: 18),
                    label: Text(items[index].name),
                    onPressed: () =>
                        context.push('/doctors?specialty=${items[index].id}'),
                  ),
                ),
              ),
            ),
          ),
          if (appointments.valueOrNull
                  ?.where((item) => item.isUpcoming)
                  .isNotEmpty ==
              true) ...[
            const SliverToBoxAdapter(child: SectionTitle('Yaqin uchrashuv')),
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              sliver: SliverToBoxAdapter(
                child: AppointmentCard(
                  appointments.valueOrNull!.firstWhere(
                    (item) => item.isUpcoming,
                  ),
                ),
              ),
            ),
          ],
          SliverToBoxAdapter(
            child: SectionTitle(
              'Sizga yaqin klinikalar',
              action: TextButton(
                onPressed: () => context.push('/clinics'),
                child: const Text('Barchasi'),
              ),
            ),
          ),
          clinics.when(
            loading: () => const SliverToBoxAdapter(
              child: SizedBox(height: 230, child: LoadingCards(count: 2)),
            ),
            error: (error, _) => SliverToBoxAdapter(
              child: SizedBox(
                height: 230,
                child: ErrorState(
                  message: readableError(error),
                  onRetry: () => ref.invalidate(nearbyClinicsProvider),
                ),
              ),
            ),
            data: (items) => items.isEmpty
                ? const SliverToBoxAdapter(
                    child: SizedBox(height: 180, child: EmptyState()),
                  )
                : SliverList.separated(
                    itemCount: items.take(3).length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (_, index) => Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: ClinicCard(items[index]),
                    ),
                  ),
          ),
          SliverToBoxAdapter(
            child: SectionTitle(
              'Mavjud shifokorlar',
              action: TextButton(
                onPressed: () => context.push('/doctors'),
                child: const Text('Barchasi'),
              ),
            ),
          ),
          doctors.when(
            loading: () => const SliverToBoxAdapter(
              child: SizedBox(height: 230, child: LoadingCards(count: 2)),
            ),
            error: (error, _) => SliverToBoxAdapter(
              child: SizedBox(
                height: 230,
                child: ErrorState(
                  message: readableError(error),
                  onRetry: () => ref.invalidate(doctorsProvider),
                ),
              ),
            ),
            data: (items) => items.isEmpty
                ? const SliverToBoxAdapter(
                    child: SizedBox(height: 180, child: EmptyState()),
                  )
                : SliverList.separated(
                    itemCount: items.take(3).length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (_, index) => Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: DoctorCard(items[index]),
                    ),
                  ),
          ),
          const SliverToBoxAdapter(child: SizedBox(height: 28)),
        ],
      ),
    );
  }
}

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});
  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final query = TextEditingController();
  Timer? debounce;
  AsyncValue<SearchResultModel> result = const AsyncData(
    SearchResultModel(doctors: [], clinics: [], specialties: []),
  );

  @override
  void dispose() {
    query.dispose();
    debounce?.cancel();
    super.dispose();
  }

  void search(String value) {
    debounce?.cancel();
    if (value.trim().isEmpty) {
      setState(
        () => result = const AsyncData(
          SearchResultModel(doctors: [], clinics: [], specialties: []),
        ),
      );
      return;
    }
    debounce = Timer(const Duration(milliseconds: 350), () async {
      setState(() => result = const AsyncLoading());
      result = await AsyncValue.guard(
        () => ref.read(searchRepositoryProvider).search(value.trim()),
      );
      if (mounted) setState(() {});
    });
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Qidiruv')),
    body: Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 14),
          child: TextField(
            controller: query,
            autofocus: true,
            onChanged: search,
            decoration: InputDecoration(
              hintText: 'Shifokor, klinika, mutaxassislik',
              prefixIcon: const Icon(LucideIcons.search),
              suffixIcon: IconButton(
                tooltip: 'Tozalash',
                onPressed: () {
                  query.clear();
                  search('');
                },
                icon: const Icon(LucideIcons.x),
              ),
            ),
          ),
        ),
        Expanded(
          child: result.when(
            loading: () => const LoadingCards(),
            error: (error, _) => ErrorState(
              message: readableError(error),
              onRetry: () => search(query.text),
            ),
            data: (data) {
              final empty =
                  data.doctors.isEmpty &&
                  data.clinics.isEmpty &&
                  data.specialties.isEmpty;
              if (empty) {
                return EmptyState(
                  title: query.text.isEmpty
                      ? 'Qidirishni boshlang'
                      : 'Natija topilmadi',
                  message: query.text.isEmpty
                      ? 'Nom yoki mutaxassislik kiriting.'
                      : 'Boshqa so‘z bilan qidirib ko‘ring.',
                );
              }
              return ListView(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 28),
                children: [
                  if (data.specialties.isNotEmpty) ...[
                    const SectionTitle('Mutaxassisliklar'),
                    Wrap(
                      spacing: 8,
                      children: data.specialties
                          .map(
                            (item) => ActionChip(
                              label: Text(item.name),
                              onPressed: () =>
                                  context.push('/doctors?specialty=${item.id}'),
                            ),
                          )
                          .toList(),
                    ),
                  ],
                  if (data.clinics.isNotEmpty) ...[
                    const SectionTitle('Klinikalar'),
                    for (final clinic in data.clinics) ...[
                      ClinicCard(clinic),
                      const SizedBox(height: 12),
                    ],
                  ],
                  if (data.doctors.isNotEmpty) ...[
                    const SectionTitle('Shifokorlar'),
                    for (final doctor in data.doctors) ...[
                      DoctorCard(doctor),
                      const SizedBox(height: 12),
                    ],
                  ],
                ],
              );
            },
          ),
        ),
      ],
    ),
  );
}

class ClinicListScreen extends ConsumerWidget {
  const ClinicListScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final value = ref.watch(clinicsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Klinikalar')),
      body: value.when(
        loading: () => const LoadingCards(),
        error: (error, _) => ErrorState(
          message: readableError(error),
          onRetry: () => ref.invalidate(clinicsProvider),
        ),
        data: (items) => items.isEmpty
            ? const EmptyState()
            : RefreshIndicator(
                onRefresh: () async {
                  ref.invalidate(clinicsProvider);
                  await ref.read(clinicsProvider.future);
                },
                child: ListView.separated(
                  padding: const EdgeInsets.all(20),
                  itemCount: items.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (_, index) => ClinicCard(items[index]),
                ),
              ),
      ),
    );
  }
}

class DoctorListScreen extends ConsumerWidget {
  const DoctorListScreen({this.specialtyId, super.key});
  final int? specialtyId;
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final value = ref.watch(doctorsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Shifokorlar')),
      body: value.when(
        loading: () => const LoadingCards(),
        error: (error, _) => ErrorState(
          message: readableError(error),
          onRetry: () => ref.invalidate(doctorsProvider),
        ),
        data: (all) {
          final items = specialtyId == null
              ? all
              : all
                    .where(
                      (doctor) => doctor.affiliations.any(
                        (item) => item.specialtyId == specialtyId,
                      ),
                    )
                    .toList();
          return items.isEmpty
              ? const EmptyState()
              : ListView.separated(
                  padding: const EdgeInsets.all(20),
                  itemCount: items.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (_, index) => DoctorCard(items[index]),
                );
        },
      ),
    );
  }
}

class MapScreen extends ConsumerStatefulWidget {
  const MapScreen({super.key});
  @override
  ConsumerState<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends ConsumerState<MapScreen> {
  GoogleMapController? map;
  bool listMode = false;

  @override
  void dispose() {
    map?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final clinics = ref.watch(nearbyClinicsProvider);
    final location = ref.watch(locationProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Yaqin klinikalar'),
        actions: [
          IconButton(
            tooltip: listMode ? 'Xaritani ko‘rsatish' : 'Ro‘yxatni ko‘rsatish',
            onPressed: () => setState(() => listMode = !listMode),
            icon: Icon(listMode ? LucideIcons.map : LucideIcons.list),
          ),
        ],
      ),
      body: clinics.when(
        loading: () => const LoadingCards(),
        error: (error, _) => ErrorState(
          message: readableError(error),
          onRetry: () => ref.invalidate(nearbyClinicsProvider),
        ),
        data: (items) {
          if (listMode) {
            return ListView.separated(
              padding: const EdgeInsets.all(20),
              itemCount: items.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (_, index) => ClinicCard(items[index]),
            );
          }
          if (!AppConfig.googleMapsEnabled) {
            return const EmptyState(
              title: 'Xarita sozlanmagan',
              message:
                  'Google Maps kaliti qo‘yilgach GOOGLE_MAPS_ENABLED=true bilan '
                  'ishga tushiring. Hozir klinikalarni yuqoridagi ro‘yxat '
                  'tugmasi orqali ko‘rishingiz mumkin.',
            );
          }
          return location.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (_, __) => ErrorState(
              message: 'Joylashuvni aniqlab bo‘lmadi.',
              onRetry: () => ref.read(locationProvider.notifier).locate(),
            ),
            data: (position) => Stack(
              children: [
                GoogleMap(
                  initialCameraPosition: CameraPosition(
                    target: LatLng(position.latitude, position.longitude),
                    zoom: 13.5,
                  ),
                  myLocationEnabled: !position.manual,
                  myLocationButtonEnabled: false,
                  circles: {
                    Circle(
                      circleId: const CircleId('discovery-radius'),
                      center: LatLng(position.latitude, position.longitude),
                      radius: 5000,
                      fillColor: Theme.of(
                        context,
                      ).colorScheme.primary.withValues(alpha: .08),
                      strokeColor: Theme.of(context).colorScheme.primary,
                      strokeWidth: 1,
                    ),
                  },
                  markers: items
                      .map(
                        (clinic) => Marker(
                          markerId: MarkerId('clinic-${clinic.id}'),
                          position: LatLng(clinic.latitude, clinic.longitude),
                          infoWindow: InfoWindow(title: clinic.name),
                          icon: BitmapDescriptor.defaultMarkerWithHue(
                            BitmapDescriptor.hueAzure,
                          ),
                          onTap: () => _showClinic(context, clinic),
                        ),
                      )
                      .toSet(),
                  onMapCreated: (controller) => map = controller,
                ),
                Positioned(
                  right: 16,
                  bottom: 22,
                  child: Column(
                    children: [
                      FloatingActionButton.small(
                        heroTag: 'recenter',
                        tooltip: 'Mening joylashuvim',
                        onPressed: () => map?.animateCamera(
                          CameraUpdate.newLatLng(
                            LatLng(position.latitude, position.longitude),
                          ),
                        ),
                        child: const Icon(LucideIcons.locateFixed),
                      ),
                      const SizedBox(height: 10),
                      FloatingActionButton.extended(
                        heroTag: 'search-area',
                        onPressed: () => ref.invalidate(nearbyClinicsProvider),
                        icon: const Icon(LucideIcons.search),
                        label: const Text('Shu hududda qidirish'),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  void _showClinic(BuildContext context, ClinicModel clinic) {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (context) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ClinicCard(clinic),
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {
                      Navigator.pop(context);
                      context.push('/clinics/${clinic.id}');
                    },
                    child: const Text('Klinikani ko‘rish'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: FilledButton(
                    onPressed: () {
                      Navigator.pop(context);
                      context.push('/clinics/${clinic.id}');
                    },
                    child: const Text('Yozilish'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
