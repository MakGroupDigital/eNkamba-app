import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.enkamba.app',
  appName: 'eNkamba',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    url: 'https://enkamba.io',
    cleartext: true
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
