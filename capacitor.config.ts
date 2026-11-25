import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.livre.app',
  appName: 'Livre',
  webDir: 'dist',
  backgroundColor: '#F8F6F2',
  android: { allowMixedContent: false },
};

export default config;
