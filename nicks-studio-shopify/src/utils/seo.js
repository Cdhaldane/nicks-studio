// sitemap.xml generator for better SEO
const generateSitemap = () => {
  const baseUrl = 'https://nickolamagnolia.com'; // Replace with your actual domain
  const currentDate = new Date().toISOString().split('T')[0];
  
  const pages = [
    {
      url: '',
      changefreq: 'weekly',
      priority: '1.0',
      lastmod: currentDate
    },
    {
      url: '/about',
      changefreq: 'monthly',
      priority: '0.8',
      lastmod: currentDate
    },
    {
      url: '/music',
      changefreq: 'weekly',
      priority: '0.9',
      lastmod: currentDate
    },
    {
      url: '/shop',
      changefreq: 'weekly',
      priority: '0.8',
      lastmod: currentDate
    },
    {
      url: '/privacy',
      changefreq: 'yearly',
      priority: '0.3',
      lastmod: currentDate
    },
    {
      url: '/terms',
      changefreq: 'yearly',
      priority: '0.3',
      lastmod: currentDate
    },
    {
      url: '/accessibility',
      changefreq: 'yearly',
      priority: '0.3',
      lastmod: currentDate
    }
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
};

// robots.txt content
export const robotsTxt = `User-agent: *
Allow: /

# Sitemap
Sitemap: https://nickolamagnolia.com/sitemap.xml

# Block specific paths if needed
# Disallow: /admin/
# Disallow: /private/

# Crawl delay (optional)
Crawl-delay: 1`;

export default generateSitemap;
