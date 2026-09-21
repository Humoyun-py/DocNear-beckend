import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../app/settings_controller.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/providers.dart';
import 'auth_controller.dart';

@visibleForTesting
Future<bool> Function(Uri) launchTelegramUrl = (url) =>
    launchUrl(url, mode: LaunchMode.externalApplication);

@visibleForTesting
String formatUzbekPhoneInput(String value) {
  var digits = value.replaceAll(RegExp(r'\D'), '');
  if (digits.length <= 3 && '998'.startsWith(digits)) return '+998';
  if (digits.startsWith('998')) {
    digits = digits.substring(3);
  } else if (digits.startsWith('0')) {
    digits = digits.substring(1);
  }
  if (digits.length > 9) digits = digits.substring(0, 9);

  String part(int start, int end) {
    if (digits.length <= start) return '';
    final safeEnd = digits.length < end ? digits.length : end;
    return digits.substring(start, safeEnd);
  }

  final groups = [
    part(0, 2),
    part(2, 5),
    part(5, 7),
    part(7, 9),
  ].where((group) => group.isNotEmpty);
  return '+998${groups.isEmpty ? '' : ' ${groups.join(' ')}'}';
}

class UzbekPhoneInputFormatter extends TextInputFormatter {
  const UzbekPhoneInputFormatter();

  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    final formatted = formatUzbekPhoneInput(newValue.text);
    return TextEditingValue(
      text: formatted,
      selection: TextSelection.collapsed(offset: formatted.length),
    );
  }
}

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
  final phone = TextEditingController(text: '+998');
  final code = TextEditingController();
  final firstName = TextEditingController();
  final lastName = TextEditingController();
  bool codeStep = false;
  bool sending = false;
  Uri? botUrl;
  String? error;
  String? errorCode;

  @override
  void dispose() {
    phone.dispose();
    code.dispose();
    firstName.dispose();
    lastName.dispose();
    super.dispose();
  }

  String get normalizedPhone {
    var digits = phone.text.replaceAll(RegExp(r'\D'), '');
    if (digits.startsWith('00')) digits = digits.substring(2);
    if (digits.length == 10 && digits.startsWith('0')) {
      digits = digits.substring(1);
    }
    if (digits.length == 9) digits = '998$digits';
    return '+$digits';
  }

  bool get validPhone =>
      !RegExp(r'[^\d+\s().-]').hasMatch(phone.text) &&
      RegExp(r'^\+[1-9]\d{7,14}$').hasMatch(normalizedPhone);

  Future<bool> openTelegramBot(Uri url) async {
    final opened = await launchTelegramUrl(url);
    if (!opened && mounted) {
      setState(() => error = 'Telegram botni ochib bo‘lmadi.');
    }
    return opened;
  }

  Future<void> startTelegramHandoff() async {
    if (sending || ref.read(authProvider).verifying) return;
    setState(() {
      error = null;
      errorCode = null;
    });
    ref.read(authProvider.notifier).clearError();
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
    final normalized = normalizedPhone;
    try {
      final url = await ref
          .read(authRepositoryProvider)
          .createTelegramHandoff(
            phoneNumber: normalized,
            purpose: widget.purpose,
            firstName: firstName.text.trim(),
            lastName: lastName.text.trim(),
          );
      if (!mounted) return;
      final opened = await openTelegramBot(url);
      if (!mounted || !opened) return;
      setState(() {
        phone.text = formatUzbekPhoneInput(normalized);
        code.clear();
        codeStep = true;
        botUrl = url;
      });
    } catch (caught) {
      if (mounted) {
        setState(() {
          errorCode = caught is ApiException ? caught.code : null;
          error = switch (errorCode) {
            'account_already_exists' =>
              'Bu telefon raqami bilan hisob allaqachon mavjud.',
            'account_not_found' => 'Bu telefon raqami uchun hisob topilmadi.',
            _
                when caught is ApiException &&
                    !caught.message.startsWith('Please check') =>
              caught.message,
            _ => 'So‘rov bajarilmadi. Qayta urinib ko‘ring.',
          };
        });
      }
    } finally {
      if (mounted) setState(() => sending = false);
    }
  }

  Future<void> verify() async {
    if (sending || ref.read(authProvider).verifying) return;
    setState(() => error = null);
    final normalizedCode = code.text.trim();
    if (!RegExp(r'^\d{6}$').hasMatch(normalizedCode)) {
      setState(() => error = '6 xonali tasdiqlash kodini kiriting.');
      return;
    }
    await ref
        .read(authProvider.notifier)
        .verifyOtp(
          phoneNumber: normalizedPhone,
          code: normalizedCode,
          purpose: widget.purpose,
        );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(authProvider);
    final busy =
        sending || state.status == AuthStatus.checking || state.verifying;
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
                  Text(
                    widget.purpose == 'login'
                        ? 'Kirish kodi so‘raladi. Email va parol talab qilinmaydi.'
                        : 'Ro‘yxatdan o‘tish kodi so‘raladi. Email va parol talab qilinmaydi.',
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 28),
                  if (widget.purpose == 'register' && !codeStep) ...[
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: firstName,
                            enabled: !busy,
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
                            enabled: !busy,
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
                    enabled: !codeStep && !busy,
                    keyboardType: TextInputType.phone,
                    inputFormatters: const [UzbekPhoneInputFormatter()],
                    autofillHints: const [AutofillHints.telephoneNumber],
                    decoration: const InputDecoration(
                      labelText: 'Telefon raqamingizni kiriting',
                      hintText: '+998 90 123 45 67',
                      prefixIcon: Icon(LucideIcons.phone),
                    ),
                  ),
                  if (codeStep) ...[
                    const SizedBox(height: 14),
                    const Text(
                      'Tasdiqlash kodi Telegram bot orqali yuboriladi.\n'
                      'Botda telefon raqamingizni yuboring, keyin olgan 6 xonali kodni shu yerga kiriting.',
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 14),
                    TextField(
                      controller: code,
                      keyboardType: TextInputType.number,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
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
                    if (errorCode == 'account_already_exists')
                      TextButton(
                        onPressed: busy ? null : () => context.go('/login'),
                        child: const Text('Kirish'),
                      ),
                    if (errorCode == 'account_not_found')
                      TextButton(
                        onPressed: busy ? null : () => context.go('/register'),
                        child: const Text('Ro‘yxatdan o‘tish'),
                      ),
                  ],
                  const SizedBox(height: 20),
                  FilledButton.icon(
                    onPressed: busy
                        ? null
                        : codeStep
                        ? verify
                        : startTelegramHandoff,
                    icon: Icon(
                      codeStep ? LucideIcons.shieldCheck : LucideIcons.send,
                    ),
                    label: Text(
                      busy
                          ? 'Kutilmoqda...'
                          : codeStep
                          ? 'Tasdiqlash'
                          : 'Tasdiqlash kodini olish',
                    ),
                  ),
                  const SizedBox(height: 10),
                  if (codeStep)
                    Column(
                      children: [
                        const Text('Faqat oxirgi yuborilgan kod amal qiladi.'),
                        TextButton.icon(
                          onPressed: busy || botUrl == null
                              ? null
                              : () => openTelegramBot(botUrl!),
                          icon: const Icon(LucideIcons.externalLink),
                          label: const Text('Telegram botni qayta ochish'),
                        ),
                        TextButton(
                          onPressed: busy
                              ? null
                              : () => setState(() {
                                  codeStep = false;
                                  code.clear();
                                  botUrl = null;
                                  error = null;
                                  errorCode = null;
                                }),
                          child: const Text('Telefon raqamini o‘zgartirish'),
                        ),
                      ],
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
