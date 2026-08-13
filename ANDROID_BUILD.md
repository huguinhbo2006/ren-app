# 📱 Guía de Compilación y Publicación Android — Rentame

Esta guía documenta los pasos necesarios para compilar, sincronizar y generar el paquete APK / AAB de la aplicación móvil **Rentame** para Android utilizando **Ionic 8 + Capacitor 8**.

---

## 🛠️ Requisitos Previos

1. **Node.js**: v20.x o superior.
2. **JDK**: Java Development Kit 17 (OpenJDK 17 recomendado).
3. **Android Studio**: Versión Hedgehog / Iguana / Jellyfish con:
   - Android SDK Platform 34 (Android 14)
   - Android SDK Build-Tools 34.x
   - Android SDK Command-line Tools
   - Emulador Android (o dispositivo físico con depuración USB activada)

---

## 🚀 Pasos de Compilación y Sincronización

### 1. Instalar dependencias del proyecto móvil
```bash
cd app
npm install
```

### 2. Compilar el bundle web de producción
```bash
npm run build
```
> Esto generará los archivos optimizados dentro del directorio `app/www/`.

### 3. Agregar la plataforma Android (si es la primera vez)
```bash
npx cap add android
```

### 4. Sincronizar plugins nativos y assets
```bash
npx cap sync android
```

---

## 📦 Permisos Configurados en AndroidManifest.xml

Capacitor sincroniza automáticamente los permisos requeridos por los plugins en `android/app/src/main/AndroidManifest.xml`:

```xml
<!-- Acceso a Internet y Red -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

<!-- Cámara para fotografías de activos y comprobantes de gastos -->
<uses-permission android:name="android.permission.CAMERA" />

<!-- Almacenamiento para guardar contratos y recibos PDF -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />

<!-- Motor de Vibración y Hápticos -->
<uses-permission android:name="android.permission.VIBRATE" />
```

---

## 🧪 Ejecutar en Emulador o Dispositivo de Prueba

```bash
# Abrir el proyecto en Android Studio
npx cap open android

# O ejecutar directamente desde la CLI
npx cap run android
```

---

## 🏭 Generación de APK de Release / Producción

1. En Android Studio, abre el menú **Build > Generate Signed Bundle / APK**.
2. Selecciona **Android App Bundle** (para Google Play Store) o **APK** (para distribución directa).
3. Configura tu Keystore de firma (`rentame-release-key.jks`).
4. Selecciona la variante `release` y haz clic en **Finish**.
5. Tu archivo compilado estará disponible en:
   `android/app/release/app-release.apk`
