import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.enkamba.app',
  appName: 'eNkamba',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    // Pour production, charge depuis le site déployé
    // url: 'https://www.enkamba.io',
    // cleartext: true // Désactivé pour utiliser l'URL de production
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
    },
  },
};

export default config;
