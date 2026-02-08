import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:get_it/get_it.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'core/api/api_client.dart';
import 'features/auth/bloc/auth_bloc.dart';
import 'features/auth/pages/login_page.dart';
import 'features/parking/bloc/parking_bloc.dart';
import 'features/reservations/bloc/reservation_bloc.dart';
import 'features/parking/pages/home_page.dart';
import 'features/parking/pages/lot_detail_page.dart';
import 'core/widgets/main_scaffold.dart';

final getIt = GetIt.instance;

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Setup dependency injection
  final prefs = await SharedPreferences.getInstance();
  getIt.registerSingleton<SharedPreferences>(prefs);
  getIt.registerSingleton<ApiClient>(ApiClient(prefs));

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider(
          create: (context) =>
              AuthBloc(getIt<ApiClient>(), getIt<SharedPreferences>())
                ..add(CheckAuthStatus()),
        ),
        BlocProvider(create: (context) => ParkingBloc(getIt<ApiClient>())),
        BlocProvider(create: (context) => ReservationBloc(getIt<ApiClient>())),
      ],
      child: MaterialApp(
        title: 'Smart Parking',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
          useMaterial3: true,
          appBarTheme: const AppBarTheme(centerTitle: true, elevation: 2),
        ),
        home: BlocBuilder<AuthBloc, AuthState>(
          builder: (context, state) {
            if (state is Authenticated) {
              return const MainScaffold();
            } else if (state is Unauthenticated || state is AuthError) {
              return const LoginPage();
            }
            // Loading state
            return const Scaffold(
              body: Center(child: CircularProgressIndicator()),
            );
          },
        ),
        onGenerateRoute: (settings) {
          if (settings.name == '/home') {
            return MaterialPageRoute(builder: (_) => const HomePage());
          } else if (settings.name == '/lot-detail') {
            final lotId = settings.arguments as String;
            return MaterialPageRoute(
              builder: (_) => LotDetailPage(lotId: lotId),
            );
          }
          return null;
        },
      ),
    );
  }
}
