# Mate Engine Mobile

Mobile app for Mate Engine with Clawdbot AI integration. Chat with your avatar using text or voice!

## Features

- **Avatar Selection**: Choose between 3D models and PNGTubers
- **Text Chat**: Send messages and receive AI responses
- **Voice Chat**: Push-to-talk recording with speech-to-text
- **File Sharing**: Attach documents, PDFs, images, and more
- **Text-to-Speech**: Hear AI responses in Jinx's voice

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   Mate Engine Mobile                             │
│                   (React Native + Expo)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   AvatarSelectionScreen ──► ChatScreen ──► SettingsScreen        │
│                                 │                                │
│                                 ▼                                │
│                        ClawdbotService                           │
│                                 │                                │
└─────────────────────────────────┼────────────────────────────────┘
                                  │
           ┌──────────────────────┼──────────────────────┐
           │                      │                      │
           ▼                      ▼                      ▼
    ┌─────────────┐       ┌─────────────┐       ┌─────────────┐
    │  Deepgram   │       │  Clawdbot   │       │ ElevenLabs  │
    │    STT      │       │   Server    │       │    TTS      │
    └─────────────┘       └─────────────┘       └─────────────┘
```

---

# 🚀 Guía de Instalación para Galaxy A55

## Paso 1: Preparar tu Computadora

### Windows

1. Instala **Node.js** (versión 18+):
   - Descarga de: https://nodejs.org
   - Ejecuta el instalador

2. Instala **Expo CLI**:
   ```cmd
   npm install -g expo-cli eas-cli
   ```

3. Crea cuenta en **Expo**:
   - Ve a: https://expo.dev/signup
   - Regístrate con tu email

### Mac

```bash
# Instalar Homebrew si no lo tienes
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Instalar Node.js
brew install node

# Instalar Expo CLI
npm install -g expo-cli eas-cli
```

---

## Paso 2: Descargar y Configurar el Proyecto

```bash
# Clonar o descargar este proyecto
cd mate-engine-mobile

# Instalar dependencias
npm install

# Login en Expo
eas login
```

---

## Paso 3: Configurar el Servidor (EC2)

Antes de usar la app, asegúrate de que tu servidor EC2 esté corriendo:

```bash
# Conectar a EC2
ssh -i tu-llave.pem ubuntu@TU_EC2_IP

# Verificar que Clawdbot está corriendo
systemctl --user status clawdbot-gateway

# Iniciar el servidor HTTP (si no lo has hecho)
cd ~/clawdbot-server
pm2 start clawdbot-server.js --name "clawdbot-api"
```

---

## Paso 4: Crear APK para Android

### Opción A: Build en la Nube (Recomendado)

```bash
# Crear APK de prueba
eas build --platform android --profile preview
```

Esto tomará ~10-15 minutos. Cuando termine, recibirás un link para descargar el APK.

### Opción B: Build Local (Requiere Android Studio)

```bash
# Instalar dependencias de build
npm install -g @expo/ngrok

# Generar proyecto nativo
npx expo prebuild

# Build local
cd android
./gradlew assembleRelease
```

El APK estará en: `android/app/build/outputs/apk/release/`

---

## Paso 5: Instalar en Galaxy A55

### Desde el link de EAS Build

1. En tu Galaxy A55, abre el link que recibiste de EAS
2. Descarga el archivo `.apk`
3. Abre el archivo descargado
4. Si aparece "Instalación bloqueada":
   - Ve a **Ajustes > Seguridad**
   - Activa **Fuentes desconocidas** o **Instalar apps desconocidas**
   - Permite instalar desde **Chrome** o **Archivos**
5. Toca **Instalar**

### Desde computadora via USB

1. Conecta tu Galaxy A55 al computador con cable USB
2. En el teléfono, selecciona **Transferir archivos**
3. Copia el APK a la carpeta **Download** del teléfono
4. En el teléfono, abre **Archivos** y busca el APK
5. Toca para instalar

---

## Paso 6: Configurar la App

1. Abre **Mate Engine** en tu teléfono
2. Toca **Configure AI** (o el icono de engranaje)
3. Ingresa:
   - **Server URL**: `http://TU_EC2_IP:3000`
   - **Deepgram API Key**: Tu clave de Deepgram
   - **ElevenLabs API Key**: Tu clave de ElevenLabs
4. Toca **Test Connection** para verificar
5. Toca **Save Settings**

---

## Paso 7: ¡Usar la App!

1. Selecciona un avatar (3D o PNGTuber)
2. Toca **Continue to Chat**
3. Para escribir: escribe en el campo de texto y envía
4. Para hablar: mantén presionado el botón del micrófono
5. Para adjuntar archivos: toca el icono de clip 📎

---

## Solución de Problemas

### "No se puede conectar al servidor"
- Verifica que el puerto 3000 esté abierto en AWS Security Group
- Verifica que el servidor esté corriendo: `pm2 status`
- Prueba desde el navegador: `http://TU_EC2_IP:3000/health`

### "Error de permisos de micrófono"
- Ve a Ajustes > Apps > Mate Engine > Permisos
- Activa el permiso de Micrófono

### "La voz no se escucha"
- Verifica que ingresaste la API key de ElevenLabs
- Sube el volumen del teléfono
- Verifica que el Voice ID sea válido

### "El APK no se instala"
- Verifica que tienes espacio suficiente
- Activa "Fuentes desconocidas" en Ajustes > Seguridad
- Si dice "App no compatible", necesitas un build diferente

---

## Desarrollo

### Modo desarrollo (con hot reload)

```bash
# Iniciar servidor de desarrollo
npx expo start

# En tu teléfono:
# 1. Instala "Expo Go" desde Play Store
# 2. Escanea el QR code que aparece en la terminal
```

### Estructura del proyecto

```
mate-engine-mobile/
├── App.js                    # Entry point
├── app.json                  # Expo config
├── eas.json                  # Build config
├── src/
│   ├── screens/
│   │   ├── AvatarSelectionScreen.js
│   │   ├── ChatScreen.js
│   │   └── SettingsScreen.js
│   ├── components/
│   │   └── AvatarDisplay.js
│   └── services/
│       └── ClawdbotService.js
└── assets/
    ├── models/               # 3D models (.glb)
    └── pngtuber/            # PNGTuber images
```

---

## API Keys Necesarias

| Servicio | Propósito | Obtener en |
|----------|-----------|------------|
| Deepgram | Speech-to-Text | https://console.deepgram.com |
| ElevenLabs | Text-to-Speech | https://elevenlabs.io |

---

## Licencia

MIT License
