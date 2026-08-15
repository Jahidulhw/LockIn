import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lockin.app',
  appName: 'LockIn',
  webDir: 'frontend/dist',
  server: {
    androidScheme: 'https',
  },
  ios: {
    contentInset: 'always',
    scrollEnabled: false,
    backgroundColor: '#0a0a0a',
  },
  plugins: {
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#000000',
      overlaysWebView: true,
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#0a0a0a',
      showSpinner: false,
    },
  },
};

export default config;
