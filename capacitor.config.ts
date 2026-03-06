import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.enkamba.app',
  appName: 'eNkamba',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    // Charger depuis le site de production (mode serveur)
    url: 'https://www.enkamba.io',
    cleartext: false,
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#32BB78",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#32BB78',
      overlaysWebView: false,
    },
    Keyboard: {
      resize: 'native',
      style: 'dark',
      resizeOnFullScreen: true,
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '60114170881-1h775tgj6rlku54t07dv2m12b47io2u3.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
