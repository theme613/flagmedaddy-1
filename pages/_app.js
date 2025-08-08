import "@/styles/globals.css";

export default function App({ Component, pageProps }) {
  // Aggressive error suppression for browser extension conflicts
  if (typeof window !== 'undefined') {
    // Override console.error to suppress extension errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');
      if (message.includes('Extension ID') || 
          message.includes('runtime.sendMessage') || 
          message.includes('chrome.runtime') ||
          message.includes('chrome-extension://')) {
        // Suppress extension-related errors
        return;
      }
      originalConsoleError.apply(console, args);
    };

    // Global error handler for unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const message = event.reason?.message || event.reason?.toString() || '';
      if (message.includes('Extension ID') || 
          message.includes('runtime.sendMessage') || 
          message.includes('chrome.runtime') ||
          message.includes('chrome-extension://')) {
        console.warn('Browser extension error suppressed');
        event.preventDefault();
        return;
      }
    });

    // Global error handler
    window.addEventListener('error', (event) => {
      const message = event.error?.message || event.message || '';
      if (message.includes('Extension ID') || 
          message.includes('runtime.sendMessage') || 
          message.includes('chrome.runtime') ||
          message.includes('chrome-extension://')) {
        console.warn('Browser extension error suppressed');
        event.preventDefault();
        return;
      }
    });

    // Additional handler for Next.js error overlay
    const originalError = window.Error;
    window.Error = function(...args) {
      const error = new originalError(...args);
      const message = error.message || '';
      if (message.includes('Extension ID') || 
          message.includes('runtime.sendMessage') || 
          message.includes('chrome.runtime') ||
          message.includes('chrome-extension://')) {
        // Return a harmless error instead
        return new originalError('Browser extension conflict resolved');
      }
      return error;
    };
  }

  return <Component {...pageProps} />;
}
