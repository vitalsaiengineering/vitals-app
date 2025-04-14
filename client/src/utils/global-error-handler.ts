export const setupGlobalErrorHandler = () => {
  window.onerror = (message, source, lineno, colno, error) => {
    console.error('Global Error:', { message, source, lineno, colno, error });
  };

  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled Promise Rejection:', event.reason);
  });
};