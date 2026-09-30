// src/bd/check-roles.js
// Verifica la tabla "roles" y, opcionalmente, el rol de un usuario por correo.
// Uso:
// npm run db:roles
// npm run db:roles -- coordinador@gmail.com
import { supabaseAdmin } from '../app/config/supabaseAdmin.js';

const ROLES_ESPERADOS = ['admin', 'coordinador', 'director_grupo', 'padre_familia', 'estudiante'];

async function verificarRoles() {
  const { data: roles, error } = await supabaseAdmin
    .from('roles')
    .select('id, nombre')
    .order('id');

  if (error) {
    console.error('❌ No se pudo leer "roles" →', error.message);
    process.exit(1);
  }

  console.log('📋 Roles en la base de datos:');
  console.table(roles);

  const nombres = roles.map((r) => r.nombre);
  const faltantes = ROLES_ESPERADOS.filter((r) => !nombres.includes(r));
  if (faltantes.length) {
    console.warn('⚠️ Faltan roles:', faltantes.join(', '));
  } else {
    console.log('✅ Están los 5 roles del manual');
  }
}

async function verificarUsuario(correo) {
  // 1) Buscar el usuario en Supabase Auth por correo
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) {
    console.error('❌ Auth →', error.message);
    process.exit(1);
  }

  const authUser = data.users.find((u) => u.email?.toLowerCase() === correo.toLowerCase());
  if (!authUser) {
    console.warn(`⚠️ No existe ningún usuario en Auth con el correo ${correo}`);
    return;
  }

  // 2) Buscar su fila en public.usuarios con el nombre del rol
  const { data: usuario, error: errUsuario } = await supabaseAdmin
    .from('usuarios')
    .select('id, nombre, estado, rol_id, roles(nombre)')
    .eq('id', authUser.id)
    .maybeSingle();

  if (errUsuario) {
    console.error('❌ No se pudo leer "usuarios" →', errUsuario.message);
    process.exit(1);
  }
  if (!usuario) {
    console.warn('⚠️ Está en Auth pero NO en public.usuarios (¿el trigger handle_new_user no corrió?)');
    return;
  }

  console.log(`\n👤 Usuario ${correo}:`);
  console.table([{
    id: usuario.id,
    nombre: usuario.nombre,
    estado: usuario.estado,
    rol_id: usuario.rol_id,
    rol: usuario.roles?.nombre,
  }]);
}

await verificarRoles();

const correo = process.argv[2];
if (correo) await verificarUsuario(correo);