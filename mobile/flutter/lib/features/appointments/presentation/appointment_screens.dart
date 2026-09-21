import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../app/data_providers.dart';
import '../../../core/providers.dart';
import '../../../shared/models/models.dart';
import '../../../shared/widgets/app_widgets.dart';

class AppointmentsScreen extends ConsumerWidget {
  const AppointmentsScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final value = ref.watch(appointmentsProvider);
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Uchrashuvlarim'),
          bottom: const TabBar(
            tabs: [
              Tab(text: 'Kelgusi'),
              Tab(text: 'O‘tgan'),
              Tab(text: 'Bekor qilingan'),
            ],
          ),
        ),
        body: value.when(
          loading: () => const LoadingCards(),
          error: (error, _) => ErrorState(
            message: readableError(error),
            onRetry: () => ref.invalidate(appointmentsProvider),
          ),
          data: (items) {
            final upcoming = items.where((item) => item.isUpcoming).toList();
            final past = items
                .where((item) => {'completed', 'no_show'}.contains(item.status))
                .toList();
            final cancelled = items
                .where(
                  (item) => {'cancelled', 'rejected'}.contains(item.status),
                )
                .toList();
            return TabBarView(
              children: [
                _list(upcoming, ref),
                _list(past, ref),
                _list(cancelled, ref),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _list(List<AppointmentModel> items, WidgetRef ref) => items.isEmpty
      ? const EmptyState(
          title: 'Uchrashuv yo‘q',
          message: 'Shifokor tanlab yangi uchrashuv yarating.',
        )
      : RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(appointmentsProvider);
            await ref.read(appointmentsProvider.future);
          },
          child: ListView.separated(
            padding: const EdgeInsets.all(20),
            itemCount: items.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (_, index) => AppointmentCard(items[index]),
          ),
        );
}

class AppointmentDetailsScreen extends ConsumerWidget {
  const AppointmentDetailsScreen({required this.id, super.key});
  final int id;
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final value = ref.watch(appointmentDetailsProvider(id));
    return Scaffold(
      appBar: AppBar(title: const Text('Uchrashuv tafsilotlari')),
      body: value.when(
        loading: () => const LoadingCards(),
        error: (error, _) => ErrorState(
          message: readableError(error),
          onRetry: () => ref.invalidate(appointmentDetailsProvider(id)),
        ),
        data: (appointment) => ListView(
          padding: const EdgeInsets.all(20),
          children: [
            AppointmentCard(appointment),
            const SizedBox(height: 18),
            _row(LucideIcons.hash, 'Booking ID', appointment.bookingId),
            _row(LucideIcons.stethoscope, 'Shifokor', appointment.doctorName),
            _row(LucideIcons.building2, 'Klinika', appointment.clinicName),
            _row(
              LucideIcons.activity,
              'Mutaxassislik',
              appointment.specialtyName,
            ),
            _row(LucideIcons.calendarDays, 'Sana', appointment.date),
            _row(
              LucideIcons.clock3,
              'Vaqt',
              '${appointment.startTime} – ${appointment.endTime}',
            ),
            if (appointment.patientNote.isNotEmpty)
              _row(LucideIcons.clipboardEdit, 'Izoh', appointment.patientNote),
            if (appointment.cancelReason.isNotEmpty)
              _row(
                LucideIcons.messageSquare,
                'Sabab',
                appointment.cancelReason,
              ),
            if (appointment.isUpcoming) ...[
              const SizedBox(height: 22),
              FilledButton.tonalIcon(
                onPressed: () => context.push('/appointments/$id/reschedule'),
                icon: const Icon(LucideIcons.calendarClock),
                label: const Text('Qayta rejalash'),
              ),
              const SizedBox(height: 10),
              OutlinedButton.icon(
                onPressed: () => _cancel(context, ref, appointment),
                icon: const Icon(LucideIcons.xCircle),
                label: const Text('Bekor qilish'),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _row(IconData icon, String label, String value) => ListTile(
    contentPadding: EdgeInsets.zero,
    leading: Icon(icon),
    title: Text(label),
    subtitle: Text(value),
  );

  Future<void> _cancel(
    BuildContext context,
    WidgetRef ref,
    AppointmentModel appointment,
  ) async {
    final reason = TextEditingController();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Uchrashuvni bekor qilish'),
        content: TextField(
          controller: reason,
          maxLines: 3,
          decoration: const InputDecoration(labelText: 'Sabab (ixtiyoriy)'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Ortga'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Bekor qilish'),
          ),
        ],
      ),
    );
    if (confirmed != true) {
      reason.dispose();
      return;
    }
    try {
      await ref
          .read(appointmentRepositoryProvider)
          .cancel(appointment.id, reason.text.trim());
      ref.invalidate(appointmentDetailsProvider(id));
      ref.invalidate(appointmentsProvider);
      if (context.mounted) context.pop();
    } catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(readableError(error))));
      }
    } finally {
      reason.dispose();
    }
  }
}

class RescheduleAppointmentScreen extends ConsumerStatefulWidget {
  const RescheduleAppointmentScreen({required this.id, super.key});
  final int id;
  @override
  ConsumerState<RescheduleAppointmentScreen> createState() =>
      _RescheduleAppointmentScreenState();
}

class _RescheduleAppointmentScreenState
    extends ConsumerState<RescheduleAppointmentScreen> {
  DateTime date = DateTime.now();
  String? time;
  bool saving = false;
  String get dateValue => DateFormat('yyyy-MM-dd').format(date);

  @override
  Widget build(BuildContext context) {
    final appointment = ref.watch(appointmentDetailsProvider(widget.id));
    return Scaffold(
      appBar: AppBar(title: const Text('Qayta rejalash')),
      body: appointment.when(
        loading: () => const LoadingCards(),
        error: (error, _) => ErrorState(
          message: readableError(error),
          onRetry: () => ref.invalidate(appointmentDetailsProvider(widget.id)),
        ),
        data: (item) {
          final query = AvailabilityQuery(
            item.doctorId,
            item.clinicId,
            dateValue,
          );
          final slots = ref.watch(availabilityProvider(query));
          return ListView(
            padding: const EdgeInsets.all(20),
            children: [
              AppointmentCard(item),
              const SectionTitle('Yangi sana'),
              SizedBox(
                height: 72,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: 14,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (_, index) {
                    final day = DateTime.now().add(Duration(days: index));
                    return ChoiceChip(
                      selected: DateUtils.isSameDay(day, date),
                      onSelected: (_) => setState(() {
                        date = day;
                        time = null;
                      }),
                      label: Text(DateFormat('dd MMM').format(day)),
                    );
                  },
                ),
              ),
              const SectionTitle('Yangi vaqt'),
              slots.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (error, _) => ErrorState(
                  message: readableError(error),
                  onRetry: () => ref.invalidate(availabilityProvider(query)),
                ),
                data: (value) => Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: value.slots
                      .where((slot) => slot.available)
                      .map(
                        (slot) => ChoiceChip(
                          selected: time == slot.time,
                          onSelected: (_) => setState(() => time = slot.time),
                          label: Text(slot.time),
                        ),
                      )
                      .toList(),
                ),
              ),
              const SizedBox(height: 28),
              FilledButton.icon(
                onPressed: time == null || saving ? null : () => _save(query),
                icon: const Icon(LucideIcons.save),
                label: const Text('Yangi vaqtni saqlash'),
              ),
            ],
          );
        },
      ),
    );
  }

  Future<void> _save(AvailabilityQuery query) async {
    setState(() => saving = true);
    try {
      await ref
          .read(appointmentRepositoryProvider)
          .reschedule(widget.id, dateValue, time!);
      ref.invalidate(appointmentDetailsProvider(widget.id));
      ref.invalidate(appointmentsProvider);
      if (mounted) context.pop();
    } catch (error) {
      ref.invalidate(availabilityProvider(query));
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(readableError(error))));
      }
    } finally {
      if (mounted) setState(() => saving = false);
    }
  }
}
