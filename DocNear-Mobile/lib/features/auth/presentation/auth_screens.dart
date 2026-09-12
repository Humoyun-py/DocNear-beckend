import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../app/settings_controller.dart';
import 'auth_controller.dart';

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});
  @override
  Widget build(BuildContext context) => Scaffold(
    body: Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 84,
            height: 84,
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.primary,
              borderRadius: BorderRadius.circular(26),
            ),
            child: const Icon(
              LucideIcons.stethoscope,
              color: Colors.white,
              size: 42,
            ),
          ),
          const SizedBox(height: 18),
          Text(
            'DOCNEAR',
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
              fontWeight: FontWeight.w900,
              letterSpacing: 2,
            ),
          ),
          const SizedBox(height: 8),
          const Text('Find the right doctor near you.'),
          const SizedBox(height: 32),
          const CircularProgressIndicator(),
        ],
      ),
    ),
  );
}

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});
  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final controller = PageController();
  int page = 0;
  static const pages = [
    (
      LucideIcons.mapPin,
      'Yaqin klinikalarni toping',
      'Tasdiqlangan hamkor klinikalarni xarita va ro‘yxatda ko‘ring.',
    ),
    (
      LucideIcons.calendarCheck,
      'Qulay vaqtda yoziling',
      'Shifokorning haqiqiy bo‘sh vaqtlarini backend orqali tanlang.',
    ),
    (
      LucideIcons.shieldCheck,
      'Ishonchli boshqaruv',
      'Booking ID, uchrashuv holati va bildirishnomalarni bir joyda kuzating.',
    ),
  ];

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    body: SafeArea(
      child: Column(
        children: [
          Align(
            alignment: Alignment.centerRight,
            child: TextButton(
              onPressed: _complete,
              child: const Text('O‘tkazib yuborish'),
            ),
          ),
          Expanded(
            child: PageView.builder(
              controller: controller,
              itemCount: pages.length,
              onPageChanged: (value) => setState(() => page = value),
              itemBuilder: (context, index) {
                final item = pages[index];
                return Padding(
                  padding: const EdgeInsets.all(34),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        width: 128,
                        height: 128,
                        decoration: BoxDecoration(
                          color: Theme.of(context).colorScheme.primaryContainer,
                          borderRadius: BorderRadius.circular(40),
                        ),
                        child: Icon(
                          item.$1,
                          size: 58,
                          color: Theme.of(context).colorScheme.primary,
                        ),
                      ),
                      const SizedBox(height: 38),
                      Text(
                        item.$2,
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.headlineSmall
                            ?.copyWith(fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: 15),
                      Text(
                        item.$3,
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.bodyLarge,
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(
              pages.length,
              (index) => AnimatedContainer(
                margin: const EdgeInsets.all(4),
                duration: const Duration(milliseconds: 220),
                width: page == index ? 26 : 8,
                height: 8,
                decoration: BoxDecoration(
                  color: page == index
                      ? Theme.of(context).colorScheme.primary
                      : Theme.of(context).colorScheme.outlineVariant,
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(24),
            child: FilledButton(
              onPressed: page == pages.length - 1
                  ? _complete
                  : () => controller.nextPage(
                      duration: const Duration(milliseconds: 250),
                      curve: Curves.easeOut,
                    ),
              child: Text(page == pages.length - 1 ? 'Boshlash' : 'Keyingi'),
            ),
          ),
        ],
      ),
    ),
  );

  Future<void> _complete() async {
    await ProviderScope.containerOf(
      context,
    ).read(appSettingsProvider.notifier).completeOnboarding();
    if (mounted) context.go('/login');
  }
}

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});
  @override
  Widget build(BuildContext context) =>
      const _PhoneAuthScreen(purpose: 'login');
}

class RegisterScreen extends StatelessWidget {
  const RegisterScreen({super.key});
  @override
  Widget build(BuildContext context) =>
      const _PhoneAuthScreen(purpose: 'register');
}

class _PhoneAuthScreen extends ConsumerStatefulWidget {
  const _PhoneAuthScreen({required this.purpose});
  final String purpose;
  @override
  ConsumerState<_PhoneAuthScreen> createState() => _PhoneAuthScreenState();
}

class _PhoneAuthScreenState extends ConsumerState<_PhoneAuthScreen> {
  static const configuredTelegramUsername = String.fromEnvironment(
    'TELEGRAM_BOT_USERNAME',
  );
  final phone = TextEditingController(text: '+998');
  final code = TextEditingController();
  final firstName = TextEditingController();
  final lastName = TextEditingController();
  bool codeStep = false;
  bool sending = false;
  String? error;

  @override
  void dispose() {
    phone.dispose();
    code.dispose();
    firstName.dispose();
    lastName.dispose();
    super.dispose();
  }

  bool get validPhone =>
      RegExp(r'^\+[1-9]\d{7,14}$').hasMatch(phone.text.trim());

  String get telegramUsername => configuredTelegramUsername.trim().replaceFirst(
    RegExp(r'^@'),
    '',
  );

  Future<void> openTelegramBot() async {
    final opened = await launchUrl(
      Uri.https('t.me', '/$telegramUsername'),
      mode: LaunchMode.externalApplication,
    );
    if (!opened && mounted) {
      setState(() => error = 'Telegram botni ochib bo‘lmadi.');
    }
  }

  Future<void> send(String channel) async {
    setState(() => error = null);
    if (!validPhone) {
      setState(
        () =>
            error = 'Telefon raqamni xalqaro formatda kiriting: +998901234567',
      );
      return;
    }
    if (widget.purpose == 'register' && firstName.text.trim().isEmpty) {
      setState(() => error = 'Ismingizni kiriting.');
      return;
    }
    setState(() => sending = true);
    final message = await ref
        .read(authProvider.notifier)
        .requestOtp(
          phoneNumber: phone.text.trim(),
          purpose: widget.purpose,
          channel: channel,
          firstName: firstName.text.trim(),
          lastName: lastName.text.trim(),
        );
    if (mounted)
      setState(() {
        sending = false;
        error = message;
        if (message == null) codeStep = true;
      });
  }

  Future<void> verify() async {
    setState(() => error = null);
    if (!RegExp(r'^\d{6}$').hasMatch(code.text)) {
      setState(() => error = '6 xonali tasdiqlash kodini kiriting.');
      return;
    }
    await ref
        .read(authProvider.notifier)
        .verifyOtp(
          phoneNumber: phone.text.trim(),
          code: code.text,
          purpose: widget.purpose,
        );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(authProvider);
    final busy = sending || state.status == AuthStatus.checking;
    final visibleError = error ?? state.error;
    return Scaffold(
      appBar: widget.purpose == 'register'
          ? AppBar(title: const Text('Hisob yaratish'))
          : null,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 480),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Icon(
                    LucideIcons.stethoscope,
                    size: 52,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                  const SizedBox(height: 20),
                  Text(
                    widget.purpose == 'login'
                        ? 'Telefon orqali kirish'
                        : 'Bemor hisobini yaratish',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Email va parol talab qilinmaydi.',
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 28),
                  if (widget.purpose == 'register' && !codeStep) ...[
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: firstName,
                            decoration: const InputDecoration(
                              labelText: 'Ism',
                              prefixIcon: Icon(LucideIcons.user),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: TextField(
                            controller: lastName,
                            decoration: const InputDecoration(
                              labelText: 'Familiya',
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                  ],
                  TextField(
                    controller: phone,
                    enabled: !codeStep,
                    keyboardType: TextInputType.phone,
                    autofillHints: const [AutofillHints.telephoneNumber],
                    decoration: const InputDecoration(
                      labelText: 'Telefon raqamingizni kiriting',
                      hintText: '+998901234567',
                      prefixIcon: Icon(LucideIcons.phone),
                    ),
                  ),
                  if (codeStep) ...[
                    const SizedBox(height: 14),
                    TextField(
                      controller: code,
                      keyboardType: TextInputType.number,
                      maxLength: 6,
                      textAlign: TextAlign.center,
                      decoration: const InputDecoration(
                        labelText: 'Tasdiqlash kodini kiriting',
                        prefixIcon: Icon(LucideIcons.shieldCheck),
                      ),
                    ),
                  ],
                  if (visibleError != null) ...[
                    const SizedBox(height: 12),
                    Text(
                      visibleError,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.error,
                      ),
                    ),
                  ],
                  const SizedBox(height: 20),
                  FilledButton.icon(
                    onPressed: busy
                        ? null
                        : codeStep
                        ? verify
                        : () => send('sms'),
                    icon: Icon(
                      codeStep
                          ? LucideIcons.shieldCheck
                          : LucideIcons.messageSquare,
                    ),
                    label: Text(
                      busy
                          ? 'Kutilmoqda...'
                          : codeStep
                          ? 'Tasdiqlash'
                          : 'Tasdiqlash kodini yuborish',
                    ),
                  ),
                  const SizedBox(height: 10),
                  if (!codeStep)
                    OutlinedButton.icon(
                      onPressed: busy ? null : () => send('telegram'),
                      icon: const Icon(LucideIcons.send),
                      label: const Text('Kodni Telegram orqali olish'),
                    ),
                  if (codeStep)
                    TextButton.icon(
                      onPressed: busy ? null : () => send('sms'),
                      icon: const Icon(LucideIcons.refreshCw),
                      label: const Text('Kodni qayta yuborish'),
                    ),
                  if (!codeStep)
                    const Padding(
                      padding: EdgeInsets.only(top: 8),
                      child: Text(
                        'Telegram uchun avval DocNear botida telefon raqamingizni ulashing.',
                        textAlign: TextAlign.center,
                      ),
                    ),
                  if (!codeStep && telegramUsername.isNotEmpty)
                    TextButton.icon(
                      onPressed: busy ? null : openTelegramBot,
                      icon: const Icon(LucideIcons.externalLink),
                      label: const Text('Telegram botni ochish'),
                    ),
                  const SizedBox(height: 8),
                  TextButton(
                    onPressed: busy
                        ? null
                        : () => context.go(
                            widget.purpose == 'login' ? '/register' : '/login',
                          ),
                    child: Text(
                      widget.purpose == 'login'
                          ? 'Yangi hisob yaratish'
                          : 'Kirish sahifasiga qaytish',
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
