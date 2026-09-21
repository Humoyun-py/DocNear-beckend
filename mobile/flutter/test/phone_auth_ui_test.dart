import 'package:docnear_mobile/app/router.dart';
import 'package:docnear_mobile/app/settings_controller.dart';
import 'package:docnear_mobile/core/providers.dart';
import 'package:docnear_mobile/core/network/api_exception.dart';
import 'package:docnear_mobile/core/storage/secure_token_store.dart';
import 'package:docnear_mobile/features/auth/data/auth_repository.dart';
import 'package:docnear_mobile/features/auth/presentation/auth_screens.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:shared_preferences/shared_preferences.dart';

class MockAuthRepository extends Mock implements AuthRepository {}

class MockTokens extends Mock implements SecureTokenStore {}

const phoneNumber = '+998901234567';
final handoffUrl = Uri.parse(
  'https://t.me/docnear_test_bot?start=opaque-token',
);

Finder field(String label) => find.byWidgetPredicate(
  (widget) => widget is TextField && widget.decoration?.labelText == label,
);

void main() {
  late MockAuthRepository repository;
  late MockTokens tokens;
  late ProviderContainer container;
  late List<Uri> openedUrls;

  setUp(() async {
    SharedPreferences.setMockInitialValues({'onboarding_complete': true});
    final preferences = await SharedPreferences.getInstance();
    repository = MockAuthRepository();
    tokens = MockTokens();
    openedUrls = [];
    launchTelegramUrl = (url) async {
      openedUrls.add(url);
      return true;
    };
    when(() => tokens.readAccess()).thenAnswer((_) async => null);
    when(() => tokens.clear()).thenAnswer((_) async {});
    when(
      () => repository.createTelegramHandoff(
        phoneNumber: any(named: 'phoneNumber'),
        purpose: any(named: 'purpose'),
        firstName: any(named: 'firstName'),
        lastName: any(named: 'lastName'),
      ),
    ).thenAnswer((_) async => handoffUrl);
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

  testWidgets('login and register show one primary Telegram handoff action', (
    tester,
  ) async {
    await mount(tester);
    expect(find.text('Tasdiqlash kodini olish'), findsOneWidget);
    expect(find.text('Kodni Telegram orqali olish'), findsNothing);
    container.read(routerProvider).go('/register');
    await tester.pumpAndSettle();
    expect(find.text('Tasdiqlash kodini olish'), findsOneWidget);
  });

  testWidgets('handoff opens returned bot URL and advances to code step', (
    tester,
  ) async {
    await mount(tester);
    await tester.enterText(
      field('Telefon raqamingizni kiriting'),
      '90 123 45 67',
    );
    expect(
      tester
          .widget<TextField>(field('Telefon raqamingizni kiriting'))
          .controller!
          .text,
      '+998 90 123 45 67',
    );
    await tester.tap(find.text('Tasdiqlash kodini olish'));
    await tester.pumpAndSettle();
    verify(
      () => repository.createTelegramHandoff(
        phoneNumber: phoneNumber,
        purpose: 'login',
        firstName: '',
        lastName: '',
      ),
    ).called(1);
    expect(openedUrls, [handoffUrl]);
    expect(find.text('Tasdiqlash kodini kiriting'), findsOneWidget);
    expect(find.text('Telegram botni qayta ochish'), findsOneWidget);
    await tester.tap(find.text('Telegram botni qayta ochish'));
    await tester.pumpAndSettle();
    expect(openedUrls, [handoffUrl, handoffUrl]);
  });

  test('Uzbek phone formatter handles compact, local, paste, and letters', () {
    const formatter = UzbekPhoneInputFormatter();
    TextEditingValue format(String value) => formatter.formatEditUpdate(
      const TextEditingValue(text: '+998'),
      TextEditingValue(text: value),
    );

    expect(format('+998200008839').text, '+998 20 000 88 39');
    expect(format('998200008839').text, '+998 20 000 88 39');
    expect(format('200008839').text, '+998 20 000 88 39');
    expect(format('abc').text, '+998');
  });

  testWidgets('register handoff keeps names and existing verify flow', (
    tester,
  ) async {
    when(
      () => repository.verifyOtp(
        phoneNumber: phoneNumber,
        code: '123456',
        purpose: 'register',
      ),
    ).thenThrow(Exception('verification checked'));
    await mount(tester);
    container.read(routerProvider).go('/register');
    await tester.pumpAndSettle();
    await tester.enterText(field('Ism'), 'Ali');
    await tester.enterText(field('Familiya'), 'Valiyev');
    await tester.enterText(field('Telefon raqamingizni kiriting'), phoneNumber);
    await tester.tap(find.text('Tasdiqlash kodini olish'));
    await tester.pumpAndSettle();
    verify(
      () => repository.createTelegramHandoff(
        phoneNumber: phoneNumber,
        purpose: 'register',
        firstName: 'Ali',
        lastName: 'Valiyev',
      ),
    ).called(1);
    await tester.enterText(field('Tasdiqlash kodini kiriting'), '123456');
    await tester.tap(find.text('Tasdiqlash'));
    await tester.pumpAndSettle();
    verify(
      () => repository.verifyOtp(
        phoneNumber: phoneNumber,
        code: '123456',
        purpose: 'register',
      ),
    ).called(1);
  });

  testWidgets(
    'existing account blocks register handoff and shows login action',
    (tester) async {
      when(
        () => repository.createTelegramHandoff(
          phoneNumber: any(named: 'phoneNumber'),
          purpose: 'register',
          firstName: any(named: 'firstName'),
          lastName: any(named: 'lastName'),
        ),
      ).thenThrow(
        const ApiException(
          'technical envelope text',
          code: 'account_already_exists',
          statusCode: 400,
        ),
      );
      await mount(tester);
      container.read(routerProvider).go('/register');
      await tester.pumpAndSettle();
      await tester.enterText(field('Ism'), 'Ali');
      await tester.enterText(
        field('Telefon raqamingizni kiriting'),
        phoneNumber,
      );
      await tester.tap(find.text('Tasdiqlash kodini olish'));
      await tester.pumpAndSettle();
      expect(
        find.text('Bu telefon raqami bilan hisob allaqachon mavjud.'),
        findsOneWidget,
      );
      expect(find.text('Kirish'), findsOneWidget);
      expect(find.text('technical envelope text'), findsNothing);
      expect(openedUrls, isEmpty);
    },
  );

  testWidgets(
    'missing login account shows register action without technical text',
    (tester) async {
      when(
        () => repository.createTelegramHandoff(
          phoneNumber: any(named: 'phoneNumber'),
          purpose: 'login',
          firstName: any(named: 'firstName'),
          lastName: any(named: 'lastName'),
        ),
      ).thenThrow(
        const ApiException(
          'Please check the submitted information. 0:',
          code: 'account_not_found',
          statusCode: 400,
        ),
      );
      await mount(tester);
      await tester.enterText(
        field('Telefon raqamingizni kiriting'),
        phoneNumber,
      );
      await tester.tap(find.text('Tasdiqlash kodini olish'));
      await tester.pumpAndSettle();
      expect(
        find.text('Bu telefon raqami uchun hisob topilmadi.'),
        findsOneWidget,
      );
      expect(find.text('Ro‘yxatdan o‘tish'), findsOneWidget);
      expect(find.textContaining('Please check'), findsNothing);
      expect(openedUrls, isEmpty);
    },
  );
}
