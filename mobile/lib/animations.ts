import { 
  FadeInUp, 
  FadeInDown, 
  SlideInRight, 
  SlideInLeft,
  ZoomIn,
  BounceIn,
  FadeIn,
  SlideInUp,
  SlideInDown
} from 'react-native-reanimated';

export const NavigationAnimations = {
  // Animations de navigation
  slideFromRight: SlideInRight.duration(300).springify(),
  slideFromLeft: SlideInLeft.duration(300).springify(),
  slideFromUp: SlideInUp.duration(300).springify(),
  slideFromDown: SlideInDown.duration(300).springify(),
  
  // Animations de fondu
  fadeInUp: FadeInUp.duration(300).springify(),
  fadeInDown: FadeInDown.duration(300).springify(),
  fadeIn: FadeIn.duration(250),
  
  // Animations d'effet
  zoomIn: ZoomIn.duration(200),
  bounceIn: BounceIn.duration(400),
  
  // Animations rapides
  quickFadeIn: FadeIn.duration(150),
  quickSlideIn: SlideInRight.duration(200),
};

export type AnimationDirection = 'forward' | 'backward' | 'up' | 'down' | 'fade' | 'zoom' | 'bounce';

export const getNavigationAnimation = (direction: AnimationDirection) => {
  switch (direction) {
    case 'forward':
      return NavigationAnimations.slideFromRight;
    case 'backward':
      return NavigationAnimations.slideFromLeft;
    case 'up':
      return NavigationAnimations.slideFromUp;
    case 'down':
      return NavigationAnimations.slideFromDown;
    case 'fade':
      return NavigationAnimations.fadeIn;
    case 'zoom':
      return NavigationAnimations.zoomIn;
    case 'bounce':
      return NavigationAnimations.bounceIn;
    default:
      return NavigationAnimations.fadeInUp;
  }
};

// Animations spécifiques pour les composants
export const ComponentAnimations = {
  // Header et SubHeader
  headerSlideIn: FadeInDown.duration(250),
  subHeaderSlideIn: FadeInUp.duration(200),
  
  // Breadcrumbs
  breadcrumbFadeIn: FadeInUp.duration(200).delay(100),
  
  // Contenu
  contentFadeIn: FadeIn.duration(300).delay(150),
  contentSlideIn: SlideInUp.duration(300).delay(100),
  
  // Boutons
  buttonPress: ZoomIn.duration(100),
  buttonBounce: BounceIn.duration(200),
  
  // Listes et cartes
  cardFadeIn: FadeInUp.duration(250),
  listItemSlideIn: SlideInRight.duration(200),
};

// Helper pour créer des animations avec délai
export const createDelayedAnimation = (baseAnimation: any, delay: number = 0) => {
  return baseAnimation.delay(delay);
};

// Helper pour créer des animations séquentielles
export const createSequentialAnimations = (animations: any[], delays: number[]) => {
  return animations.map((animation, index) => 
    createDelayedAnimation(animation, delays[index] || 0)
  );
};
