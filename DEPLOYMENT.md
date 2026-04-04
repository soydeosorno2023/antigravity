# Guía de Despliegue en Hostinger

Sigue estos pasos para desplegar la aplicación en tu cuenta de Hostinger.

## 1. Preparación del Proyecto (Local)

Antes de subir los archivos, genera el bundle de producción en tu máquina local:

```bash
npm run build
```

Esto generará:
- La carpeta `dist/` (archivos frontend estáticos).
- El archivo `server.js` (servidor backend compilado).

## 2. Archivos a Subir

Debes subir los siguientes archivos a la carpeta raíz de tu aplicación en Hostinger (normalmente vía el Administrador de Archivos o FTP):

- `dist/` (toda la carpeta)
- `server.js`
- `package.json`
- `.env` (crea uno nuevo en el servidor con tus credenciales reales)
- `uploads/` (carpeta vacía si no existe)

## 3. Configuración en el Panel de Hostinger

### Si usas Hosting de Node.js (Panel hPanel):
1. Ve a **Sitios Web** -> **Administrar** -> **Node.js**.
2. Asegúrate de que la versión de Node.js sea **>= 22.0.0**.
3. Configura el **Archivo de entrada (Entry point)** como `server.js`.
4. En **Variables de Entorno**, añade todas las claves definidas en tu archivo `.env`.
   - *Importante*: La variable `FIREBASE_SERVICE_ACCOUNT` debe ser el JSON completo de tu cuenta de servicio pegado como una sola línea.
5. Haz clic en **Iniciar** o **Reiniciar**.

### Si usas VPS:
1. Sube los archivos vía SSH/SCP.
2. Instala las dependencias de producción:
   ```bash
   npm install --production
   ```
3. Usa un gestor de procesos como **PM2** para mantener la app activa:
   ```bash
   pm2 start server.js --name "antigravity"
   ```

## 4. Configuración de Firebase (Nueva DB)

1. **Firestore**: Crea la base de datos en la consola de Firebase.
2. **Reglas**: Asegúrate de publicar las reglas de seguridad adecuadas en la pestaña "Rules".
3. **Cuentas de Servicio**: Generas una nueva clave privada en *Configuración del proyecto -> Cuentas de servicio* y usa ese JSON para la variable `FIREBASE_SERVICE_ACCOUNT`.

## 5. Verificación
Una vez desplegado, accede a `https://tu-dominio.com/api/health` para confirmar que el servidor responde correctamente.
