/* global gtag */
const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

const sendToAnalytics = ({ name, delta, id }) => {
  gtag('event', name, {
    event_category: 'Web Vitals',
    event_label: id,
    value: Math.round(name === 'CLS' ? delta * 1000 : delta), // values must be integers
    non_interaction: true, // avoids affecting bounce rate
  });
};

const report = (onPerfEntry) => {
  reportWebVitals((metric) => {
    sendToAnalytics(metric);
    if (onPerfEntry) {
      onPerfEntry(metric);
    }
  });
};

export default report;