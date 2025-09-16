import 'dotenv/config';

export default {
  expo: {
    name: "AgriConnect",
    slug: "agriconnect-mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/images/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "sn.agriconnect.mobile"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "sn.agriconnect.mobile",
      versionCode: 1
    },
    web: {
      favicon: "./assets/images/favicon.png"
    },
    extra: {
      eas: {
        projectId: "b9d32764-8e4e-4568-a8e4-cac9e3c2170c"
      }
    },
    plugins: [
      "expo-router",
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "Cette app a besoin d'accéder à votre localisation pour géolocaliser les parcelles agricoles."
        }
      ],
      [
        "expo-camera",
        {
          cameraPermission: "Cette app a besoin d'accéder à votre caméra pour prendre des photos des parcelles."
        }
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/images/notification-icon.png",
          color: "#ffffff"
        }
      ]
    ],
    scheme: "agriconnect"
  }
};
