export {};

declare global {
  interface Window {
    SumaBannerHero?: { mountAll?: () => void };
    ParticlesBg?: {
      autoMount?: () => void | Promise<void>;
      mount?: (el: Element) => void | Promise<void>;
    };
  }
}
