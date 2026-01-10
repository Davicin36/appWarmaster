import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function crearSuperAdmin() {
  let connection;
  
  try {
    // Conectar a la base de datos
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('✅ Conectado a la base de datos');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Datos del SuperAdmin
    const superAdmin = {
      nombre: 'David',
      apellidos: 'Administrador',
      email: 'warmastermadrid23@gmail.com',
      password: 'Warmaster23!', // ⚠️ CÁMBIALA DESPUÉS DEL PRIMER LOGIN
      estado_cuenta: 'activo',
      rol: 'superadmin',
      codigo_postal: 28840,
      localidad: 'Mejorada del campo',
      pais: 'España'
    };

    console.log('🔐 CREANDO SUPERADMIN');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', superAdmin.email);
    console.log('🔑 Password:', superAdmin.password);
    console.log('👤 Nombre:', `${superAdmin.nombre} ${superAdmin.apellidos}`);
    console.log('👑 Rol:', superAdmin.rol);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Verificar si ya existe
    console.log('\n🔍 Verificando si el usuario ya existe...');
    const [usuariosExistentes] = await connection.execute(
      'SELECT id, email, rol FROM usuarios WHERE email = ?',
      [superAdmin.email]
    );

    if (usuariosExistentes.length > 0) {
      const usuarioExistente = usuariosExistentes[0];
      console.log('\n⚠️  EL USUARIO YA EXISTE');
      console.log('   ID:', usuarioExistente.id);
      console.log('   Email:', usuarioExistente.email);
      console.log('   Rol actual:', usuarioExistente.rol);
      
      // Preguntar si quiere actualizar
      console.log('\n📝 Actualizando contraseña y rol a superadmin...');
      
      const passwordHash = await bcrypt.hash(superAdmin.password, 10);
      
      await connection.execute(
        `UPDATE usuarios 
         SET password = ?, 
             rol = 'superadmin',
             nombre = ?,
             apellidos = ?,
             codigo_postal = ?,
             estado_cuenta = ?,
             localidad = ?,
             pais = ?
         WHERE email = ?`,
        [
          passwordHash,
          superAdmin.nombre,
          superAdmin.apellidos,
          superAdmin.codigo_postal,
          superAdmin.estado_cuenta,
          superAdmin.localidad,
          superAdmin.pais,
          superAdmin.email
        ]
      );

      console.log('✅ Usuario actualizado exitosamente');
    } else {
      // Crear nuevo usuario
      console.log('✅ Usuario no existe, creando nuevo...');
      
      console.log('\n🔒 Hasheando contraseña...');
      const passwordHash = await bcrypt.hash(superAdmin.password, 10);
      console.log('✅ Hash generado:', passwordHash.substring(0, 30) + '...');
      console.log('📏 Longitud del hash:', passwordHash.length);

      console.log('\n💾 Insertando en la base de datos...');
      const [result] = await connection.execute(
        `INSERT INTO usuarios 
         (nombre, apellidos, email, password, estado_cuenta, codigo_postal, localidad, pais, rol, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          superAdmin.nombre,
          superAdmin.apellidos,
          superAdmin.email,
          passwordHash,
          superAdmin.estado_cuenta,
          superAdmin.codigo_postal,
          superAdmin.localidad,
          superAdmin.pais,
          superAdmin.rol
        ]
      );

      console.log('✅ SuperAdmin creado con ID:', result.insertId);
    }

    // Verificar el usuario creado/actualizado
    console.log('\n🔍 Verificando usuario final...');
    const [usuarioFinal] = await connection.execute(
      `SELECT id, nombre, apellidos, email, nombre_alias, rol, 
              LENGTH(password) as password_length,
              SUBSTRING(password, 1, 20) as password_preview,
              created_at
       FROM usuarios 
       WHERE email = ?`,
      [superAdmin.email]
    );

    if (usuarioFinal.length > 0) {
      const user = usuarioFinal[0];
      console.log('\n✅ USUARIO VERIFICADO:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🆔 ID:', user.id);
      console.log('📧 Email:', user.email);
      console.log('👤 Nombre:', `${user.nombre} ${user.apellidos}`);
      console.log('🎭 Estado cuenta:', user.estado_cuenta);
      console.log('👑 Rol:', user.rol);
      console.log('🔒 Password hash length:', user.password_length);
      console.log('🔒 Password preview:', user.password_preview + '...');
      console.log('📅 Creado:', user.created_at);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // Test de verificación de contraseña
      console.log('\n🧪 Probando verificación de contraseña...');
      const [userWithPassword] = await connection.execute(
        'SELECT password FROM usuarios WHERE email = ?',
        [superAdmin.email]
      );
      
      const testResult = await bcrypt.compare(
        superAdmin.password, 
        userWithPassword[0].password
      );
      
      console.log('🧪 Test de bcrypt.compare:', testResult ? '✅ OK' : '❌ FALLO');

      if (testResult) {
        console.log('\n🎉 ¡TODO LISTO! Puedes hacer login con:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📧 Email:', superAdmin.email);
        console.log('🔑 Password:', superAdmin.password);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n⚠️  IMPORTANTE: Cambia la contraseña después del primer login');
      } else {
        console.log('\n❌ ERROR: La verificación de contraseña falló');
        console.log('   Por favor, ejecuta el script nuevamente');
      }
    }

  } catch (error) {
    console.error('\n💥 ERROR:', error.message);
    console.error('\n📋 Detalles del error:');
    console.error(error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      console.log('\n💡 El email ya existe. Usa una opción diferente o actualiza manualmente.');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 No se pudo conectar a la base de datos. Verifica:');
      console.log('   - Que MySQL esté corriendo');
      console.log('   - Que las credenciales en .env sean correctas');
      console.log('   - Que el nombre de la base de datos sea correcto');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

// Ejecutar
console.log('\n🚀 INICIANDO CREACIÓN DE SUPERADMIN...\n');
crearSuperAdmin();