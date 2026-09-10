import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../app/data_providers.dart';
import '../../../app/settings_controller.dart';
import '../../../core/notifications/local_notification_service.dart';
import '../../../core/providers.dart';
import '../../../shared/widgets/app_widgets.dart';
import '../../auth/presentation/auth_controller.dart';

class FavoritesScreen extends ConsumerWidget {
  const FavoritesScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) => DefaultTabController(
    length: 2,
    child: Scaffold(
      appBar: AppBar(
        title: const Text('Sevimlilar'),
        bottom: const TabBar(
          tabs: [
            Tab(text: 'Shifokorlar'),
            Tab(text: 'Klinikalar'),
          ],
        ),
      ),
      body: TabBarView(
        children: [
          ref
              .watch(favoriteDoctorsProvider)
              .when(
                loading: () => const LoadingCards(),
                error: (error, _) => ErrorState(
                  message: readableError(error),
                  onRetry: () => ref.invalidate(favoriteDoctorsProvider),
                ),
                data: (items) => items.isEmpty
                    ? const EmptyState(title: 'Sevimli shifokorlar yo‘q')
                    : ListView.separated(
                        padding: const EdgeInsets.all(20),
                        itemCount: items.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 12),
                        itemBuilder: (_, index) => Dismissible(
                          key: ValueKey('doctor-${items[index].id}'),
                          direction: DismissDirection.endToStart,
                          onDismissed: (_) async {
                            await ref
                                .read(favoriteRepositoryProvider)
                                .setDoctor(items[index].id, false);
                            ref.invalidate(favoriteDoctorsProvider);
                          },
                          background: _removeBackground(context),
                          child: DoctorCard(items[index]),
                        ),
                      ),
              ),
          ref
              .watch(favoriteClinicsProvider)
              .when(
                loading: () => const LoadingCards(),
                error: (error, _) => ErrorState(
                  message: readableError(error),
                  onRetry: () => ref.invalidate(favoriteClinicsProvider),
                ),
                data: (items) => items.isEmpty
                    ? const EmptyState(title: 'Sevimli klinikalar yo‘q')
                    : ListView.separated(
                        padding: const EdgeInsets.all(20),
                        itemCount: items.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 12),
                        itemBuilder: (_, index) => Dismissible(
                          key: ValueKey('clinic-${items[index].id}'),
                          direction: DismissDirection.endToStart,
                          onDismissed: (_) async {
                            await ref
                                .read(favoriteRepositoryProvider)
                                .setClinic(items[index].id, false);
                            ref.invalidate(favoriteClinicsProvider);
                          },
                          background: _removeBackground(context),
                          child: ClinicCard(items[index]),
                        ),
                      ),
              ),
        ],
      ),
    ),
  );

  Widget _removeBackground(BuildContext context) => Container(
    alignment: Alignment.centerRight,
    padding: const EdgeInsets.all(24),
    color: Theme.of(context).colorScheme.errorContainer,
    child: const Icon(LucideIcons.trash2),
  );
}

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final value = ref.watch(notificationsProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Bildirishnomalar'),
        actions: [
          TextButton(
            onPressed: () async {
              await ref.read(notificationRepositoryProvider).markAllRead();
              ref.invalidate(notificationsProvider);
            },
            child: const Text('Barchasini o‘qish'),
          ),
        ],
      ),
      body: value.when(
        loading: () => const LoadingCards(),
        error: (error, _) => ErrorState(
          message: readableError(error),
          onRetry: () => ref.invalidate(notificationsProvider),
        ),
        data: (items) => items.isEmpty
            ? const EmptyState(title: 'Bildirishnomalar yo‘q')
            : RefreshIndicator(
                onRefresh: () async {
                  ref.invalidate(notificationsProvider);
                  await ref.read(notificationsProvider.future);
                },
                child: ListView.separated(
                  padding: const EdgeInsets.all(20),
                  itemCount: items.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (_, index) {
                    final item = items[index];
                    return Card(
                      color: item.isRead
                          ? null
                          : Theme.of(context).colorScheme.primaryContainer,
                      child: ListTile(
                        minVerticalPadding: 14,
                        leading: Icon(_notificationIcon(item.type)),
                        title: Text(
                          item.title,
                          style: const TextStyle(fontWeight: FontWeight.w700),
                        ),
                        subtitle: Text(item.message),
                        trailing: item.isRead
                            ? null
                            : const Icon(LucideIcons.circle, size: 10),
                        onTap: item.isRead
                            ? null
                            : () async {
                                await ref
                                    .read(notificationRepositoryProvider)
                                    .markRead(item.id);
                                ref.invalidate(notificationsProvider);
                              },
                      ),
                    );
                  },
                ),
              ),
      ),
    );
  }

  IconData _notificationIcon(String type) => switch (type) {
    'appointment_confirmed' => LucideIcons.calendarCheck,
    'appointment_cancelled' => LucideIcons.calendarX,
    'appointment_rescheduled' => LucideIcons.calendarClock,
    'appointment_reminder' => LucideIcons.alarmClock,
    _ => LucideIcons.bell,
  };
}

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    if (user == null) return const Center(child: CircularProgressIndicator());
    return Scaffold(
      appBar: AppBar(title: const Text('Profil')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Center(
            child: CircleAvatar(
              radius: 48,
              backgroundColor: Theme.of(context).colorScheme.primaryContainer,
              child: Text(
                user.displayName.isEmpty
                    ? 'D'
                    : user.displayName[0].toUpperCase(),
                style: Theme.of(context).textTheme.headlineMedium,
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            user.displayName,
            textAlign: TextAlign.center,
            style: Theme.of(
              context,
            ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w900),
          ),
          Text(user.role, textAlign: TextAlign.center),
          const SizedBox(height: 24),
          Card(
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(LucideIcons.mail),
                  title: const Text('Email'),
                  subtitle: Text(
                    user.email.isEmpty ? 'Kiritilmagan' : user.email,
                  ),
                ),
                ListTile(
                  leading: const Icon(LucideIcons.phone),
                  title: const Text('Telefon'),
                  subtitle: Text(
                    user.phone.isEmpty ? 'Kiritilmagan' : user.phone,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          _menu(
            context,
            LucideIcons.edit,
            'Profilni tahrirlash',
            '/profile/edit',
          ),
          _menu(context, LucideIcons.heart, 'Sevimlilar', '/favorites'),
          _menu(context, LucideIcons.settings, 'Sozlamalar', '/settings'),
          const SizedBox(height: 18),
          OutlinedButton.icon(
            onPressed: () => ref.read(authProvider.notifier).logout(),
            icon: const Icon(LucideIcons.logOut),
            label: const Text('Chiqish'),
          ),
        ],
      ),
    );
  }

  Widget _menu(
    BuildContext context,
    IconData icon,
    String title,
    String route,
  ) => Card(
    child: ListTile(
      leading: Icon(icon),
      title: Text(title),
      trailing: const Icon(LucideIcons.chevronRight),
      onTap: () => context.push(route),
    ),
  );
}

class EditProfileScreen extends ConsumerStatefulWidget {
  const EditProfileScreen({super.key});
  @override
  ConsumerState<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends ConsumerState<EditProfileScreen> {
  late final TextEditingController first;
  late final TextEditingController last;
  bool saving = false;
  @override
  void initState() {
    super.initState();
    final user = ref.read(authProvider).user!;
    first = TextEditingController(text: user.firstName);
    last = TextEditingController(text: user.lastName);
  }

  @override
  void dispose() {
    first.dispose();
    last.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Profilni tahrirlash')),
    body: ListView(
      padding: const EdgeInsets.all(20),
      children: [
        TextField(
          controller: first,
          decoration: const InputDecoration(
            labelText: 'Ism',
            prefixIcon: Icon(LucideIcons.user),
          ),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: last,
          decoration: const InputDecoration(
            labelText: 'Familiya',
            prefixIcon: Icon(LucideIcons.user),
          ),
        ),
        const SizedBox(height: 24),
        FilledButton.icon(
          onPressed: saving ? null : _save,
          icon: const Icon(LucideIcons.save),
          label: const Text('Saqlash'),
        ),
      ],
    ),
  );

  Future<void> _save() async {
    setState(() => saving = true);
    final ok = await ref.read(authProvider.notifier).updateProfile({
      'first_name': first.text.trim(),
      'last_name': last.text.trim(),
    });
    if (mounted) {
      setState(() => saving = false);
      if (ok) context.pop();
    }
  }
}

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mode = ref.watch(appSettingsProvider).themeMode;
    return Scaffold(
      appBar: AppBar(title: const Text('Sozlamalar')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text('Ko‘rinish', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 12),
          for (final item in [
            (ThemeMode.system, 'Tizim bo‘yicha', LucideIcons.smartphone),
            (ThemeMode.light, 'Yorug‘', LucideIcons.sun),
            (ThemeMode.dark, 'Qorong‘i', LucideIcons.moon),
          ])
            RadioListTile<ThemeMode>(
              value: item.$1,
              groupValue: mode,
              title: Text(item.$2),
              secondary: Icon(item.$3),
              onChanged: (value) {
                if (value != null) {
                  ref.read(appSettingsProvider.notifier).setTheme(value);
                }
              },
            ),
          const SizedBox(height: 20),
          Card(
            child: ListTile(
              leading: const Icon(LucideIcons.bellRing),
              title: const Text('Bildirishnomalar'),
              subtitle: const Text('Uchrashuv yangilanishlariga ruxsat berish'),
              trailing: const Icon(LucideIcons.chevronRight),
              onTap: LocalNotificationService.instance.requestPermission,
            ),
          ),
        ],
      ),
    );
  }
}

class EmergencyClinicsScreen extends ConsumerWidget {
  const EmergencyClinicsScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final value = ref.watch(emergencyClinicsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Favqulodda klinikalar')),
      body: value.when(
        loading: () => const LoadingCards(),
        error: (error, _) => ErrorState(
          message: readableError(error),
          onRetry: () => ref.invalidate(emergencyClinicsProvider),
        ),
        data: (items) => items.isEmpty
            ? const EmptyState(
                title: 'Yaqinda favqulodda klinika topilmadi',
                message:
                    'Hayot uchun xavf bo‘lsa mahalliy tez yordam xizmatiga qo‘ng‘iroq qiling.',
              )
            : ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          const Icon(LucideIcons.info),
                          const SizedBox(width: 12),
                          const Expanded(
                            child: Text(
                              'Bu sahifa yaqin hamkor klinikalarni ko‘rsatadi va tibbiy tashxis bermaydi.',
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  for (final clinic in items) ...[
                    ClinicCard(clinic),
                    const SizedBox(height: 8),
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
                        const SizedBox(width: 8),
                        Expanded(
                          child: FilledButton.tonalIcon(
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
                    const SizedBox(height: 14),
                  ],
                ],
              ),
      ),
    );
  }
}

class LocationPermissionScreen extends ConsumerWidget {
  const LocationPermissionScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) => Scaffold(
    body: SafeArea(
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(LucideIcons.mapPin, size: 58),
              const SizedBox(height: 20),
              Text(
                'Yaqin klinikalarni topish',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                'Joylashuv ruxsati faqat yaqin hamkor klinikalarni ko‘rsatish uchun ishlatiladi.',
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              FilledButton.icon(
                onPressed: () async {
                  await ref.read(locationProvider.notifier).locate();
                  await ref
                      .read(appSettingsProvider.notifier)
                      .completeLocationSetup();
                  if (context.mounted) context.go('/');
                },
                icon: const Icon(LucideIcons.locateFixed),
                label: const Text('Joylashuvni aniqlash'),
              ),
              TextButton(
                onPressed: () async {
                  ref.read(locationProvider.notifier).useTashkent();
                  await ref
                      .read(appSettingsProvider.notifier)
                      .completeLocationSetup();
                  if (context.mounted) context.go('/');
                },
                child: const Text('Toshkentni qo‘lda tanlash'),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}

class OfflineScreen extends StatelessWidget {
  const OfflineScreen({super.key});
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Ulanish mavjud emas')),
    body: ErrorState(
      message: 'Internet yoki DocNear API bilan aloqa yo‘q.',
      onRetry: () => context.go('/'),
    ),
  );
}
