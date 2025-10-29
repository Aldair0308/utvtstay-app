const axios = require('axios');

const API_BASE_URL = 'https://estadias-production.up.railway.app/api';

async function testCredentials(email, password) {
  try {
    console.log(`\n🔍 Probando credenciales: ${email}`);
    
    const response = await axios.post(`${API_BASE_URL}/login`, {
      email: email,
      password: password
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    if (response.data.success) {
      console.log('✅ LOGIN EXITOSO!');
      console.log('👤 Usuario:', response.data.data.user.name);
      console.log('📧 Email:', response.data.data.user.email);
      console.log('🎭 Roles:', response.data.data.user.roles);
      console.log('🔑 Token:', response.data.data.token.substring(0, 20) + '...');
      
      if (response.data.data.user.roles.includes('student')) {
        console.log('🎓 ¡Es estudiante! Puede usar la app móvil.');
      } else {
        console.log('⚠️  No es estudiante. No puede usar la app móvil.');
      }
    }
    
  } catch (error) {
    if (error.response) {
      console.log('❌ Error de credenciales:', error.response.status);
      if (error.response.status === 422) {
        console.log('   Credenciales incorrectas o usuario no existe');
      } else if (error.response.status === 401) {
        console.log('   No autorizado');
      }
      
      if (error.response.data && error.response.data.message) {
        console.log('   Mensaje:', error.response.data.message);
      }
    } else {
      console.log('❌ Error de conexión:', error.message);
    }
  }
}

async function main() {
  console.log('🚀 Probando credenciales contra el backend...\n');
  console.log('🌐 API:', API_BASE_URL);
  
  // Lista de credenciales comunes para probar
  const credentialsToTest = [
    { email: 'student@example.com', password: 'password' },
    { email: 'estudiante@test.com', password: 'password' },
    { email: 'test@test.com', password: 'test' },
    { email: 'admin@admin.com', password: 'admin' },
    { email: 'user@user.com', password: 'user' },
  ];

  for (const creds of credentialsToTest) {
    await testCredentials(creds.email, creds.password);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo entre pruebas
  }
  
  console.log('\n📝 Si ninguna credencial funcionó:');
  console.log('   1. Contacta al administrador del sistema');
  console.log('   2. Verifica que tengas una cuenta de estudiante registrada');
  console.log('   3. Asegúrate de que tu cuenta tenga el rol "student"');
}

main().catch(console.error);