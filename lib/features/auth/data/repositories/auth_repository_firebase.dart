import 'package:firebase_auth/firebase_auth.dart' as fb;

import '../../../../core/config/equipo_autorizado.dart';
import '../../domain/entities/usuario.dart';
import '../../domain/errors/cuenta_no_autorizada_exception.dart';
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
    // asyncMap (no map): además de convertir el usuario de Firebase a
    // nuestra entidad, esto cierra la sesión sola si en algún momento
    // queda una sesión guardada de una cuenta que ya no está en la
    // lista del equipo (por ejemplo, si alguien se coló mientras el
    // proyecto estaba en producción sin el filtro de emails).
    return _firebaseAuth.authStateChanges().asyncMap((usuario) async {
      if (usuario == null) return null;
      if (!_estaAutorizado(usuario)) {
        await _firebaseAuth.signOut();
        return null;
      }
      return _aUsuario(usuario);
    });
  }

  @override
  Future<void> iniciarSesionConGoogle() async {
    final tokens = await _googleOauth.iniciarSesion();
    final credencial = fb.GoogleAuthProvider.credential(
      idToken: tokens.idToken,
      accessToken: tokens.accessToken,
    );
    final resultado = await _firebaseAuth.signInWithCredential(credencial);

    final usuario = resultado.user;
    if (usuario == null || !_estaAutorizado(usuario)) {
      await _firebaseAuth.signOut();
      throw const CuentaNoAutorizadaException();
    }
  }

  @override
  Future<void> cerrarSesion() => _firebaseAuth.signOut();

  bool _estaAutorizado(fb.User usuario) {
    final email = (usuario.email ?? '').toLowerCase().trim();
    return correosEquipoAutorizado.contains(email);
  }

  Usuario? _aUsuario(fb.User? usuario) {
    if (usuario == null) return null;
    return Usuario(
      id: usuario.uid,
      email: usuario.email ?? '',
      nombre: usuario.displayName ?? '',
    );
  }
}
