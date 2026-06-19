export const isVideoUrl = (url) =>
  /\.(mp4|webm|ogg|mov|avi|mkv|quicktime)$/i.test(url || '');
