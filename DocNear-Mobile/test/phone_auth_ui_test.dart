import 'dart:async';

import 'package:docnear_mobile/app/router.dart';
import 'package:docnear_mobile/app/settings_controller.dart';
import 'package:docnear_mobile/core/network/api_exception.dart';
import 'package:docnear_mobile/core/providers.dart';
import 'package:docnear_mobile/core/storage/secure_token_store.dart';
import 'package:docnear_mobile/features/auth/data/auth_repository.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:shared_preferences/shared_preferences.dart';

class MockAuthRepository extends Mock implements AuthRepository {}

class MockTokens extends Mock implements SecureTokenStore {}

const phoneNumber = '+998901234567';
const requestMessage = 'Tasdiqlash kodini yuborish';
const telegramMessage = 'Kodni Telegram orqali olish';

Finder field(String label) => find.byWidgetPredicate(
  (widget) => widget is TextField && widget.decoration?.labelText == label,
);

void main() {
  late MockAuthRepository repository;
  late MockTokens tokens;
  late ProviderContainer container;

  setUp(() async {
    SharedPreferences.setMockInitialValues({'onboarding_complete': true});
    final preferences = await SharedPreferences.getInstance();
    repository = MockAuthRepository();
    tokens = MockTokens();
    when(() => tokens.readAccess()).thenAnswer((_) async => null);
    when(() => tokens.clear()).thenAnswer((_) async {});
    when(
      () => repository.requestOtp(
        phoneNumber: any(named: 'phoneNumber'),
        purpose: any(named: 'purpose'),
        channel: any(named: 'channel'),
        firstName: any(named: 'firstName'),
        lastName: any(named: 'lastName'),
      ),
    ).thenAnswer((_) async {});
    container = ProviderContainer(
      overrides: [
        tokenStoreProvider.overrideWithValue(tokens),
        authRepositoryProvider.overrideWithValue(repository),
        sharedPreferencesProvider.overrideWithValue(preferences),
      ],
    );
  });

  tearDown(() => container.dispose());

  Future<void> mount(WidgetTester tester) async {
    tester.view.physicalSize = const Size(1000, 1400);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: MaterialApp.router(routerConfig: container.read(routerProvider)),
      ),
    );
    await tester.pumpAndSettle();
  }

  testWidgets('session restore exits splash without recreating the router', (
    tester,
  ) async {
    final restore = Completer<String?>();
    when(() => tokens.readAccess()).thenAnswer((_) => restore.future);
    final router = container.read(routerProvider);
    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: MaterialApp.router(routerConfig: router),
      ),
    );
    await tester.pump();
    expect(router.routeInformationProvider.value.uri.path, '/splash');
    restore.complete(null);
    await tester.pumpAndSettle();
    expect(router.routeInformationProvider.value.uri.path, '/login');
    expect(identical(router, container.read(routerProvider)), isTrue);
  });

  testWidgets('wrong OTP keeps the entered phone, code and verification form', (
    tester,
  ) async {
    when(
      () => repository.verifyOtp(
        phoneNumber: phoneNumber,
        code: '123456',
        purpose: 'login',
      ),
    ).thenThrow(const ApiException('Kod noto‘g‘ri', statusCode: 400));
    await mount(tester);
    await tester.enterText(
      field('Telefon raqamingizni kiriting'),
      '90 123 45 67',
    );
    await tester.tap(find.text(requestMessage));
    await tester.pumpAndSettle();
    await tester.enterText(field('Tasdiqlash kodini kiriting'), '12a 3456');
    await tester.tap(find.text('Tasdiqlash'));
    await tester.pumpAndSettle();
    expect(find.text('Kod noto‘g‘ri'), findsOneWidget);
    expect(
      container.read(routerProvider).routeInformationProvider.value.uri.path,
      '/login',
    );
    expect(
      tester
          .widget<TextField>(field('Telefon raqamingizni kiriting'))
          .controller!
          .text,
      phoneNumber,
    );
    expect(
      tester
          .widget<TextField>(field('Tasdiqlash kodini kiriting'))
          .controller!
          .text,
      '123456',
    );
    verify(
      () => repository.verifyOtp(
        phoneNumber: phoneNumber,
        code: '123456',
        purpose: 'login',
      ),
    ).called(1);
    await tester.pumpWidget(const SizedBox.shrink());
  });

  testWidgets('429 blocks both channels before any code was sent', (
    tester,
  ) async {
    when(
      () => repository.requestOtp(
        phoneNumber: any(named: 'phoneNumber'),
        purpose: any(named: 'purpose'),
        channel: any(named: 'channel'),
        firstName: any(named: 'firstName'),
        lastName: any(named: 'lastName'),
      ),
    ).thenThrow(
      const ApiException(
        'Please wait before retrying',
        code: 'too_many_requests',
        statusCode: 429,
      ),
    );
    await mount(tester);
    await tester.enterText(field('Telefon raqamingizni kiriting'), phoneNumber);
    final originalSend = tester
        .widget<FilledButton>(find.byType(FilledButton))
        .onPressed!;
    originalSend();
    originalSend();
    await tester.pumpAndSettle();
    expect(
      tester.widget<FilledButton>(find.byType(FilledButton)).onPressed,
      isNull,
    );
    expect(
      tester.widget<OutlinedButton>(find.byType(OutlinedButton)).onPressed,
      isNull,
    );
    expect(find.text('Qayta yuborish (60s)'), findsOneWidget);
    verify(
      () => repository.requestOtp(
        phoneNumber: phoneNumber,
        purpose: 'login',
        channel: 'sms',
        firstName: '',
        lastName: '',
      ),
    ).called(1);
    await tester.pump(const Duration(seconds: 60));
    await tester.pump();
    expect(
      tester.widget<FilledButton>(find.byType(FilledButton)).onPressed,
      isNotNull,
    );
    await tester.pumpWidget(const SizedBox.shrink());
  });

  testWidgets('resend uses Telegram again and clears the old OTP', (
    tester,
  ) async {
    await mount(tester);
    await tester.enterText(field('Telefon raqamingizni kiriting'), phoneNumber);
    await tester.tap(find.text(telegramMessage));
    await tester.pumpAndSettle();
    await tester.enterText(field('Tasdiqlash kodini kiriting'), '123456');
    await tester.pump(const Duration(seconds: 60));
    await tester.pump();
    await tester.tap(find.text('Kodni qayta yuborish'));
    await tester.pumpAndSettle();
    expect(
      tester
          .widget<TextField>(field('Tasdiqlash kodini kiriting'))
          .controller!
          .text,
      '',
    );
    verify(
      () => repository.requestOtp(
        phoneNumber: phoneNumber,
        purpose: 'login',
        channel: 'telegram',
        firstName: '',
        lastName: '',
      ),
    ).called(2);
    await tester.pumpWidget(const SizedBox.shrink());
  });

  testWidgets('changing theme preserves register route and entered name', (
    tester,
  ) async {
    await mount(tester);
    final router = container.read(routerProvider);
    router.go('/register');
    await tester.pumpAndSettle();
    await tester.enterText(field('Ism'), 'Bemor');
    await container.read(appSettingsProvider.notifier).setTheme(ThemeMode.dark);
    await tester.pumpAndSettle();
    expect(identical(router, container.read(routerProvider)), isTrue);
    expect(router.routeInformationProvider.value.uri.path, '/register');
    expect(tester.widget<TextField>(field('Ism')).controller!.text, 'Bemor');
  });

  testWidgets('letters in phone number are rejected before the API call', (
    tester,
  ) async {
    await mount(tester);
    await tester.enterText(
      field('Telefon raqamingizni kiriting'),
      '${phoneNumber}abc',
    );
    await tester.tap(find.text(requestMessage));
    await tester.pumpAndSettle();
    verifyNever(
      () => repository.requestOtp(
        phoneNumber: any(named: 'phoneNumber'),
        purpose: any(named: 'purpose'),
        channel: any(named: 'channel'),
        firstName: any(named: 'firstName'),
        lastName: any(named: 'lastName'),
      ),
    );
  });
}
