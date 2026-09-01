import 'package:firebase_auth/firebase_auth.dart' as fb;

import '../../domain/entities/usuario.dart';
import '../../domain/repositories/auth_repository.dart';
import '../google_oauth_escritorio.dart';

class AuthRepositoryFirebase implements AuthRepository {
  AuthRepositoryFirebase({
    fb.FirebaseAuth? firebaseAuth,
    GoogleOauthEscritorio? googleOauth,
  }) : _firebaseAuth = firebaseAuth ?? fb.FirebaseAuth.instance,
       _googleOauth = googleOauth ?? GoogleOauthEscritorio();

  final fb.FirebaseAuth _firebaseAuth;
  final GoogleOauthEscritorio _googleOauth;

  @override
  Stream<Usuario?> observarUsuarioActual() {
    return _firebaseAuth.authStateChanges().map(_aUsuario);
  }

  @override
  Future<void> iniciarSesionConGoogle() async {
    final tokens = await _googleOauth.iniciarSesion();
    final credencial = fb.GoogleAuthProvider.credential(
      idToken: tokens.idToken,
      accessToken: tokens.accessToken,
    );
    await _firebaseAuth.signInWithCredential(credencial);
  }

  @override
  Future<void> cerrarSesion() => _firebaseAuth.signOut();

  Usuario? _aUsuario(fb.User? usuario) {
    if (usuario == null) return null;
    return Usuario(
      id: usuario.uid,
      email: usuario.email ?? '',
      nombre: usuario.displayName ?? '',
    );
  }
}
