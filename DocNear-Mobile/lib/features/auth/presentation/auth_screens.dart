import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

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

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});
  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final formKey = GlobalKey<FormState>();
  final identifier = TextEditingController();
  final password = TextEditingController();
  bool hidden = true;

  @override
  void dispose() {
    identifier.dispose();
    password.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    final loading = auth.status == AuthStatus.checking;
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 480),
              child: Form(
                key: formKey,
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
                      'Xush kelibsiz',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.headlineMedium
                          ?.copyWith(fontWeight: FontWeight.w900),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'DocNear hisobingizga kiring',
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 32),
                    TextFormField(
                      controller: identifier,
                      keyboardType: TextInputType.emailAddress,
                      autofillHints: const [AutofillHints.username],
                      decoration: const InputDecoration(
                        labelText: 'Email yoki telefon',
                        prefixIcon: Icon(LucideIcons.user),
                      ),
                      validator: (value) =>
                          value == null || value.trim().isEmpty
                          ? 'Email yoki telefonni kiriting'
                          : null,
                    ),
                    const SizedBox(height: 14),
                    TextFormField(
                      controller: password,
                      obscureText: hidden,
                      autofillHints: const [AutofillHints.password],
                      decoration: InputDecoration(
                        labelText: 'Parol',
                        prefixIcon: const Icon(LucideIcons.lock),
                        suffixIcon: IconButton(
                          tooltip: hidden
                              ? 'Parolni ko‘rsatish'
                              : 'Parolni yashirish',
                          onPressed: () => setState(() => hidden = !hidden),
                          icon: Icon(
                            hidden ? LucideIcons.eye : LucideIcons.eyeOff,
                          ),
                        ),
                      ),
                      validator: (value) => value == null || value.length < 8
                          ? 'Parol kamida 8 belgidan iborat bo‘lsin'
                          : null,
                    ),
                    if (auth.error != null) ...[
                      const SizedBox(height: 14),
                      Text(
                        auth.error!,
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: Theme.of(context).colorScheme.error,
                        ),
                      ),
                    ],
                    const SizedBox(height: 22),
                    FilledButton.icon(
                      onPressed: loading ? null : _submit,
                      icon: loading
                          ? const SizedBox.square(
                              dimension: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(LucideIcons.logIn),
                      label: const Text('Kirish'),
                    ),
                    const SizedBox(height: 14),
                    TextButton(
                      onPressed: loading
                          ? null
                          : () => context.push('/register'),
                      child: const Text('Yangi hisob yaratish'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _submit() async {
    if (!formKey.currentState!.validate()) return;
    FocusScope.of(context).unfocus();
    await ref
        .read(authProvider.notifier)
        .login(identifier.text.trim(), password.text);
  }
}

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});
  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final formKey = GlobalKey<FormState>();
  final first = TextEditingController();
  final last = TextEditingController();
  final email = TextEditingController();
  final phone = TextEditingController();
  final password = TextEditingController();

  @override
  void dispose() {
    for (final item in [first, last, email, phone, password]) {
      item.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(authProvider);
    final loading = state.status == AuthStatus.checking;
    return Scaffold(
      appBar: AppBar(title: const Text('Hisob yaratish')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: formKey,
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(child: _field(first, 'Ism', LucideIcons.user)),
                    const SizedBox(width: 12),
                    Expanded(child: _field(last, 'Familiya', LucideIcons.user)),
                  ],
                ),
                const SizedBox(height: 14),
                _field(
                  email,
                  'Email',
                  LucideIcons.mail,
                  keyboardType: TextInputType.emailAddress,
                ),
                const SizedBox(height: 14),
                _field(
                  phone,
                  'Telefon',
                  LucideIcons.phone,
                  keyboardType: TextInputType.phone,
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: password,
                  obscureText: true,
                  decoration: const InputDecoration(
                    labelText: 'Parol',
                    prefixIcon: Icon(LucideIcons.lock),
                  ),
                  validator: (value) => value == null || value.length < 8
                      ? 'Kamida 8 belgi kiriting'
                      : null,
                ),
                if (state.error != null) ...[
                  const SizedBox(height: 12),
                  Text(
                    state.error!,
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.error,
                    ),
                  ),
                ],
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: loading ? null : _submit,
                  child: const Text('Ro‘yxatdan o‘tish'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  TextFormField _field(
    TextEditingController controller,
    String label,
    IconData icon, {
    TextInputType? keyboardType,
  }) => TextFormField(
    controller: controller,
    keyboardType: keyboardType,
    decoration: InputDecoration(labelText: label, prefixIcon: Icon(icon)),
    validator: (value) => value == null || value.trim().isEmpty
        ? '$label maydonini to‘ldiring'
        : null,
  );

  Future<void> _submit() async {
    if (!formKey.currentState!.validate()) return;
    await ref
        .read(authProvider.notifier)
        .register(
          firstName: first.text.trim(),
          lastName: last.text.trim(),
          email: email.text.trim(),
          phone: phone.text.trim(),
          password: password.text,
        );
  }
}
