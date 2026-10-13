# Letralia

Juego educativo en español para descubrir el teclado y practicar lectura con acompañamiento adulto.

- Doce niveles y rondas de cinco retos con avance automático.
- Letras, sílabas, palabras, dibujos y frases; voz en español y pistas visuales.
- Invitado sin registro, o cuenta adulta por correo con varios perfiles infantiles.
- Los perfiles solo piden apodo, avatar y rango de edad; los niños no tienen cuentas de correo.

## Publicación y desarrollo

GitHub Pages publica la raíz de `main`. Es una aplicación estática, sin compilación. Existe además una instalación Nginx en Lenovo. El backend de cuentas es Supabase; ninguno de estos servidores web necesita una clave privada.

Para probar: `python -m http.server 4182 --bind 127.0.0.1` desde esta carpeta y abrir `http://127.0.0.1:4182/`.

## Cuentas: activación

Con `config.js` vacío funciona el juego de invitado. El botón Entrar indica que las cuentas todavía no están disponibles. No se solicita un correo ni se promete que se haya enviado un enlace hasta conectar el servicio.

1. Crear un proyecto Supabase. Ejecutar `supabase-schema.sql` completo en SQL Editor. Puede ejecutarse otra vez sin borrar los datos existentes.
2. En Authentication, habilitar el proveedor Email. Conservar el correo de Magic Link con su `{{ .ConfirmationURL }}`; no sustituirlo por una plantilla de código OTP.
3. En URL Configuration, configurar Site URL como `https://leystudio.github.io/letralia/`. Añadir a Redirect URLs esa misma URL y los orígenes exactos que se usarán, por ejemplo `http://localhost:4173/` (túnel Lenovo) y `http://127.0.0.1:4182/` (pruebas). No usar un comodín abierto para producción.
4. Configurar SMTP para enviar correos a los padres. El servicio de correo incluido por Supabase tiene restricciones de destinatarios y límites; comprobar entrega real antes de ofrecer cuentas públicamente. Consultar [SMTP de Supabase](https://supabase.com/docs/guides/auth/auth-smtp).
5. Copiar los valores de `config.example.js` a `config.js`: `url` y `anonKey` (clave **publishable** o **anon**). Esta clave es pública. Nunca copiar `service_role`, una clave secreta ni credenciales de base de datos al frontend.
6. Desde esta carpeta, desplegar `supabase/functions/delete-account` con Supabase CLI: `supabase functions deploy delete-account --project-ref TU_PROJECT_REF`. El archivo `supabase/config.toml` desactiva la verificación JWT del gateway para esta función; la propia función verifica obligatoriamente el bearer token mediante `auth.getUser` antes de eliminar exclusivamente ese usuario. Usa secretos internos del proyecto, nunca recibidos del navegador.
7. Publicar estos archivos y validar los flujos con dos cuentas reales de prueba.

El SDK 2.57.4 está fijado y servido desde `vendor/`; solo se carga si hay configuración. El acceso por enlace usa el flujo implícito de Supabase para una aplicación estática. El enlace vuelve al origen y ruta de la página desde la que se solicitó. [Documentación de enlaces mágicos](https://supabase.com/docs/guides/auth/auth-email-passwordless).

## Datos, sincronización y seguridad

- `parents` se crea por trigger al registrar al adulto. El cliente solo puede consultar su fila; no puede cambiar su plan a premium ni modificar el correo por SQL.
- `children` y `progress` tienen RLS y comprobaciones de propiedad tanto al leer como al escribir. La función de importación también verifica propietario. [RLS de Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security).
- `initialize_child_progress` preserva el progreso existente en la nube. Si no hay avances en la cuenta, importa el invitado una sola vez al primer perfil elegido. Una marca en la cuenta evita duplicarlo entre hermanos; otra marca local evita volver a importar ese invitado a otra cuenta desde el mismo navegador.
- El progreso invitado permanece en `letralia-v1`. Cada niño tiene una copia separada `letralia-account:<padre>:progress:<niño>`. El perfil activo existe en memoria; `letralia_active_child` es una pista local, nunca autorización ni selección automática al recargar.
- Cada cambio se guarda localmente y se envía con debounce de 2 segundos. `pending_sync` permanece mientras no haya confirmación del servidor. Se reintenta al reconectar y al abrir la cuenta. Una escritura antigua no borra cambios que llegaron mientras estaba en curso.
- La descarga de nube tiene prioridad al abrir un perfil, salvo que este dispositivo conserve cambios propios pendientes. Entre dos dispositivos que modifican simultáneamente un mismo perfil, la última escritura recibida prevalece: esta versión no combina historiales de sesiones concurrentes.
- Sin conexión se puede continuar con un perfil previamente cargado. Crear perfiles, enviar enlaces y borrar datos requiere conexión. No hay service worker: abrir el sitio por primera vez o recargarlo totalmente sin red depende de la caché del navegador.
- Cerrar sesión detiene la sincronización de esa cuenta y recupera el invitado. Los cambios aún pendientes permanecen bajo el identificador de su propietario para enviarlos al volver a entrar.
- Borrar un niño elimina su progreso por FK; borrar la cuenta elimina todos sus perfiles y avances de la nube. La copia local de esta cuenta se elimina en el dispositivo que solicita el borrado. Otros dispositivos pueden conservar cachés hasta actualizar o limpiar sus datos.
- Borrar **la caché de archivos** no es lo mismo que borrar **todos los datos del sitio**. Si se elimina localStorage, también se elimina la sesión. Tras volver a entrar por correo, se recupera lo guardado en la nube. Los avances locales nunca sincronizados no se pueden recuperar después de borrar el dispositivo.
- La suma parental es una barrera de interfaz para niños pequeños; la autorización del servidor depende de la sesión adulta y RLS. No es un control de identidad del adulto.

## Pruebas

`npm ci` instala solo dependencias de desarrollo; no se requieren para servir el juego.

- `npm test`: aislamiento del almacenamiento, colas offline, carreras de sincronización y SQL/RLS ejecutado con PostgreSQL en PGlite. Incluye dos usuarios, acceso anónimo, intento de cambiar plan, importación y cascadas.
- `npx playwright install chromium`, iniciar el servidor del apartado anterior, y `npm run test:browser`: flujos visuales con un backend simulado, más una petición OTP con el SDK real e interceptación de red. `LETRALIA_TEST_URL` permite cambiar la URL; `LETRALIA_CHROME_CHANNEL=chrome` usa Chrome instalado. Capturas en `test-results/`.

Estas pruebas no sustituyen la validación del proyecto Supabase real. Antes de activar cuentas, verificar con dos correos de prueba: recepción/enlace vencido/reenvío, rechazo de lectura y escritura cruzada con sus JWT reales, recuperación en un segundo navegador, sincronización al reconectar, eliminación de perfil y ejecución de `delete-account`. No se han enviado correos reales desde la configuración vacía incluida.

Se conservan las correcciones de pronunciación de B y «llo» y la celebración silenciosa de 350 ms.

## Recursos

Las licencias de música están en `music/LICENSE.txt` y en los ajustes. La licencia del SDK se incluye en `vendor/SUPABASE-LICENSE.txt`. Los audios grabados usan una voz en español de México. Los apodos se anuncian con una voz española del dispositivo, cuando está disponible; si no la hay, siguen visibles en la tarjeta. El selector incluye la pregunta grabada «¿Quién va a jugar hoy?».
