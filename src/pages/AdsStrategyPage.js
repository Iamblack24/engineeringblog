import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

const pagesWithAds = [
  { name: "Articles List", path: "/articles" },
  { name: "Article Detail", path: "/articles/:id" },
  { name: "Interactive Tools", path: "/tools" },
  { name: "Revision Materials", path: "/revision-materials" },
  { name: "Home Page", path: "/" },
  { name: "Case Studies", path: "/case-studies" },
  { name: "Case Studies Detail", path: "/case-studies/:id" },
  // Add other pages where ads will be shown
];

const AdsStrategyPage = () => {
  useEffect(() => {
    // Load the AdSense script dynamically if needed.
    if (!document.querySelector('script[src^="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8749998569625388';
      script.async = true;
      script.crossOrigin = 'anonymous';
      document.body.appendChild(script);
      return () => {
        document.body.removeChild(script);
      };
    }
  }, []);

  useEffect(() => {
    // Initialize the AdSense ad unit.
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error('Adsbygoogle initialization error:', e);
    }
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Segoe UI, sans-serif' }}>
      <Helmet>
        <title>Ads Strategy - Engineering Hub</title>
        <meta name="description" content="Overview of pages with integrated AdSense ads on Engineering Hub, ensuring compliance with high content quality policies." />
        <link rel="canonical" href="https://engineeringhub.engineer/ads-strategy" />
      </Helmet>

      <h1>Ads Overview & Strategy</h1>
      <p>This page displays an AdSense ad unit and a list of pages where ads will be shown on this site.</p>
      
      <section style={{ marginBottom: '30px' }}>
        <h2>Pages with Ads</h2>
        <ul>
          {pagesWithAds.map((page, index) => (
            <li key={index}>
              <strong>{page.name}</strong>: <code>{page.path}</code>
            </li>
          ))}
        </ul>
        <p>Each of these pages is designed to include substantial, high-quality content, ensuring we meet Google AdSense policies. This page itself is fully server-rendered so that crawlers can see the complete structure and content.</p>
      </section>

      <section>
        <h2>Ad Preview</h2>
        {/* AdSense ad unit container */}
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client="ca-pub-8749998569625388"
          data-ad-slot="5641752646"  // Replace with your actual ad slot ID
          data-ad-format="auto"
          data-full-width-responsive="true"
        ></ins>
      </section>
    </div>
  );
};

export default AdsStrategyPage;