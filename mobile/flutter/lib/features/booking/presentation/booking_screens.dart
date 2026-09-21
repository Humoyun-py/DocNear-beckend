import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../app/data_providers.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/notifications/local_notification_service.dart';
import '../../../core/providers.dart';
import '../../../shared/models/models.dart';
import '../../../shared/widgets/app_widgets.dart';

class BookingDraft {
  const BookingDraft({
    required this.doctor,
    required this.clinicId,
    required this.clinicName,
    required this.date,
    required this.time,
    required this.note,
  });
  final DoctorModel doctor;
  final int clinicId;
  final String clinicName;
  final String date;
  final String time;
  final String note;
}

class BookingScreen extends ConsumerStatefulWidget {
  const BookingScreen({
    required this.doctorId,
    required this.clinicId,
    super.key,
  });
  final int doctorId;
  final int clinicId;
  @override
  ConsumerState<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends ConsumerState<BookingScreen> {
  late DateTime date;
  String? time;
  final note = TextEditingController();

  @override
  void initState() {
    super.initState();
    date = DateTime.now();
  }

  @override
  void dispose() {
    note.dispose();
    super.dispose();
  }

  String get dateValue => DateFormat('yyyy-MM-dd').format(date);

  @override
  Widget build(BuildContext context) {
    final query = AvailabilityQuery(
      widget.doctorId,
      widget.clinicId,
      dateValue,
    );
    final availability = ref.watch(availabilityProvider(query));
    return Scaffold(
      appBar: AppBar(title: const Text('Vaqt tanlash')),
      body: availability.when(
        loading: () => const LoadingCards(),
        error: (error, _) => ErrorState(
          message: readableError(error),
          onRetry: () => ref.invalidate(availabilityProvider(query)),
        ),
        data: (data) => ListView(
          padding: const EdgeInsets.all(20),
          children: [
            DoctorCard(data.doctor),
            const SectionTitle('Sana'),
            SizedBox(
              height: 78,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: 14,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (_, index) {
                  final item = DateTime.now().add(Duration(days: index));
                  final selected = DateUtils.isSameDay(item, date);
                  return ChoiceChip(
                    selected: selected,
                    onSelected: (_) => setState(() {
                      date = item;
                      time = null;
                    }),
                    avatar: const Icon(LucideIcons.calendarDays, size: 16),
                    label: Text(DateFormat('dd MMM').format(item)),
                  );
                },
              ),
            ),
            const SectionTitle('Backenddagi bo‘sh vaqtlar'),
            if (data.slots.where((slot) => slot.available).isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 28),
                child: EmptyState(
                  title: 'Bu sanada bo‘sh vaqt yo‘q',
                  message: 'Boshqa sanani tanlang.',
                ),
              )
            else
              Wrap(
                spacing: 9,
                runSpacing: 9,
                children: data.slots
                    .where((slot) => slot.available)
                    .map(
                      (slot) => ChoiceChip(
                        selected: time == slot.time,
                        onSelected: (_) => setState(() => time = slot.time),
                        avatar: const Icon(LucideIcons.clock3, size: 16),
                        label: Text(slot.time),
                      ),
                    )
                    .toList(),
              ),
            const SizedBox(height: 24),
            TextField(
              controller: note,
              maxLength: 2000,
              minLines: 3,
              maxLines: 5,
              decoration: const InputDecoration(
                labelText: 'Bemor izohi (ixtiyoriy)',
                alignLabelWithHint: true,
                prefixIcon: Icon(LucideIcons.clipboardEdit),
              ),
            ),
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: time == null
                  ? null
                  : () => context.push(
                      '/booking/confirm',
                      extra: BookingDraft(
                        doctor: data.doctor,
                        clinicId: data.clinicId,
                        clinicName: data.clinicName,
                        date: data.date,
                        time: time!,
                        note: note.text.trim(),
                      ),
                    ),
              icon: const Icon(LucideIcons.arrowRight),
              label: const Text('Davom etish'),
            ),
          ],
        ),
      ),
    );
  }
}

class BookingConfirmationScreen extends ConsumerStatefulWidget {
  const BookingConfirmationScreen({required this.draft, super.key});
  final BookingDraft draft;
  @override
  ConsumerState<BookingConfirmationScreen> createState() =>
      _BookingConfirmationScreenState();
}

class _BookingConfirmationScreenState
    extends ConsumerState<BookingConfirmationScreen> {
  bool submitting = false;
  String? error;

  @override
  Widget build(BuildContext context) {
    final draft = widget.draft;
    return Scaffold(
      appBar: AppBar(title: const Text('Tasdiqlash')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text(
            'Uchrashuv ma’lumotlari',
            style: Theme.of(
              context,
            ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 18),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  _line(LucideIcons.stethoscope, 'Shifokor', draft.doctor.name),
                  _line(LucideIcons.building2, 'Klinika', draft.clinicName),
                  _line(LucideIcons.calendarDays, 'Sana', draft.date),
                  _line(LucideIcons.clock3, 'Vaqt', draft.time),
                  if (draft.note.isNotEmpty)
                    _line(LucideIcons.clipboardEdit, 'Izoh', draft.note),
                ],
              ),
            ),
          ),
          if (error != null) ...[
            const SizedBox(height: 16),
            Text(
              error!,
              textAlign: TextAlign.center,
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
          ],
          const SizedBox(height: 24),
          FilledButton.icon(
            onPressed: submitting ? null : _create,
            icon: submitting
                ? const SizedBox.square(
                    dimension: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(LucideIcons.calendarCheck),
            label: const Text('Uchrashuvni band qilish'),
          ),
        ],
      ),
    );
  }

  Widget _line(IconData icon, String label, String value) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 10),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 20),
        const SizedBox(width: 12),
        SizedBox(width: 72, child: Text(label)),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(fontWeight: FontWeight.w700),
          ),
        ),
      ],
    ),
  );

  Future<void> _create() async {
    setState(() {
      submitting = true;
      error = null;
    });
    try {
      final draft = widget.draft;
      final appointment = await ref
          .read(appointmentRepositoryProvider)
          .create(
            doctorId: draft.doctor.id,
            clinicId: draft.clinicId,
            date: draft.date,
            time: draft.time,
            note: draft.note,
          );
      await LocalNotificationService.instance.showBookingCreated(
        appointment.bookingId,
      );
      ref.invalidate(appointmentsProvider);
      if (mounted) context.go('/booking/success', extra: appointment);
    } on ApiException catch (exception) {
      if (exception.code == 'slot_unavailable' || exception.statusCode == 409) {
        final query = AvailabilityQuery(
          widget.draft.doctor.id,
          widget.draft.clinicId,
          widget.draft.date,
        );
        ref.invalidate(availabilityProvider(query));
        setState(
          () => error =
              'Bu vaqt hozirgina band qilindi. Iltimos, boshqa vaqtni tanlang.',
        );
      } else {
        setState(() => error = exception.message);
      }
    } catch (exception) {
      setState(() => error = readableError(exception));
    } finally {
      if (mounted) setState(() => submitting = false);
    }
  }
}

class BookingSuccessScreen extends StatelessWidget {
  const BookingSuccessScreen({required this.appointment, super.key});
  final AppointmentModel appointment;
  @override
  Widget build(BuildContext context) => Scaffold(
    body: SafeArea(
      child: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(28),
          child: Column(
            children: [
              Container(
                width: 98,
                height: 98,
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.secondaryContainer,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  LucideIcons.checkCircle2,
                  size: 52,
                  color: Theme.of(context).colorScheme.secondary,
                ),
              ),
              const SizedBox(height: 24),
              Text(
                'Uchrashuv yaratildi',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 10),
              const Text(
                'Booking ID ni uchrashuvni aniqlash uchun saqlang.',
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 22),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    children: [
                      Text(
                        'BOOKING ID',
                        style: Theme.of(context).textTheme.labelLarge,
                      ),
                      const SizedBox(height: 8),
                      SelectableText(
                        appointment.bookingId,
                        style: Theme.of(context).textTheme.headlineMedium
                            ?.copyWith(fontWeight: FontWeight.w900),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              FilledButton.icon(
                onPressed: () => context.go('/appointments'),
                icon: const Icon(LucideIcons.calendarDays),
                label: const Text('Uchrashuvlarim'),
              ),
              TextButton(
                onPressed: () => context.go('/'),
                child: const Text('Bosh sahifaga qaytish'),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}
