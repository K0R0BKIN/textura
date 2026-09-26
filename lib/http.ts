// Dictionary data only changes on import, followed by a redeploy, which
// starts with an empty CDN cache. Browsers revalidate hourly.
export const cacheHeaders = {
  'Cache-Control': 'public, max-age=3600, s-maxage=31536000',
};
