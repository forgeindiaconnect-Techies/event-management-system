export const DEFAULT_EVENT_BANNER = "/event-banners/default-event-banner.svg";

export const getDefaultBanner = () => DEFAULT_EVENT_BANNER;

export const useDefaultBannerOnError = (event) => {
  const image = event.currentTarget;

  // Prevent a retry loop if the local fallback itself cannot be loaded.
  image.onerror = null;
  image.src = DEFAULT_EVENT_BANNER;
};
