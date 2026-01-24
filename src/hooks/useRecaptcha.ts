import { useCallback } from 'react';

declare global {
  interface Window {
    grecaptcha: {
      enterprise: {
        execute: (siteKey: string, options: { action: string }) => Promise<string>;
      };
    };
  }
}

const RECAPTCHA_SITE_KEY = '6LfuglEsAAAAAKEs-hihNaGaobl6TFiWgG7axgw7';

export function useRecaptcha() {
  const executeRecaptcha = useCallback(async (action: string): Promise<string> => {
    if (!window.grecaptcha) {
      throw new Error('reCAPTCHA not loaded');
    }

    try {
      const token = await window.grecaptcha.enterprise.execute(RECAPTCHA_SITE_KEY, {
        action,
      });
      return token;
    } catch (error) {
      console.error('reCAPTCHA error:', error);
      throw error;
    }
  }, []);

  return { executeRecaptcha };
}
