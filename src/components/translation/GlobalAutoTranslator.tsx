'use client';

import { useEffect, useRef } from 'react';

const LANGUAGE_STORAGE_KEY = 'enkamba-dashboard-language';
const TRANSLATION_CACHE_PREFIX = 'enkamba-auto-translation';
const MAX_TEXT_LENGTH = 220;
const MAX_ITEMS_PER_BATCH = 60;
const TRANSLATABLE_ATTRIBUTES = ['placeholder', 'title', 'aria-label'] as const;

const SKIP_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'NOSCRIPT',
  'SELECT',
  'OPTION',
  'CODE',
  'PRE',
  'SVG',
]);

type TranslatableAttribute = (typeof TRANSLATABLE_ATTRIBUTES)[number];

function getCachedTranslation(language: string, text: string) {
  try {
    return window.localStorage.getItem(`${TRANSLATION_CACHE_PREFIX}:${language}:${text}`);
  } catch {
    return null;
  }
}

function setCachedTranslation(language: string, text: string, translatedText: string) {
  try {
    window.localStorage.setItem(`${TRANSLATION_CACHE_PREFIX}:${language}:${text}`, translatedText);
  } catch {
    // Translation still works without cache.
  }
}

function shouldTranslateText(text: string) {
  const clean = text.trim();
  if (clean.length < 2 || clean.length > MAX_TEXT_LENGTH) return false;
  if (!/[A-Za-zÀ-ÿ]/.test(clean)) return false;
  if (/^(https?:\/\/|www\.|[A-Z]{2,}\d{4,}|ENK\d+)/i.test(clean)) return false;
  if (/^[\d\s.,:+/%()$€-]+$/.test(clean)) return false;
  return true;
}

function isSkippedElement(element: Element | null) {
  let current = element;
  while (current) {
    if (current instanceof HTMLElement && current.closest('[data-no-auto-translate="true"]')) return true;
    if (SKIP_TAGS.has(current.tagName)) return true;
    current = current.parentElement;
  }
  return false;
}

function canTranslateNode(node: Text) {
  if (!node.parentElement || isSkippedElement(node.parentElement)) return false;
  return shouldTranslateText(node.nodeValue || '');
}

function canTranslateElement(element: Element) {
  if (!(element instanceof HTMLElement)) return false;
  if (isSkippedElement(element)) return false;
  return TRANSLATABLE_ATTRIBUTES.some((attribute) => shouldTranslateText(element.getAttribute(attribute) || ''));
}

async function translateText(text: string, language: string) {
  const cached = getCachedTranslation(language, text);
  if (cached) return cached;

  const response = await fetch('/api/chat/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, targetLanguage: language }),
  });
  const data = await response.json();
  if (!response.ok || !data?.translatedText) {
    throw new Error(data?.error || 'Traduction impossible');
  }

  const translatedText = String(data.translatedText);
  setCachedTranslation(language, text, translatedText);
  return translatedText;
}

export function GlobalAutoTranslator() {
  const languageRef = useRef('fr');
  const originalsRef = useRef<WeakMap<Text, string>>(new WeakMap());
  const translatedLanguageRef = useRef<WeakMap<Text, string>>(new WeakMap());
  const attributeOriginalsRef = useRef<WeakMap<Element, Partial<Record<TranslatableAttribute, string>>>>(new WeakMap());
  const attributeTranslatedLanguageRef = useRef<WeakMap<Element, Partial<Record<TranslatableAttribute, string>>>>(new WeakMap());
  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const translatingRef = useRef(false);

  useEffect(() => {
    const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (storedLanguage) languageRef.current = storedLanguage;

    const collectTextNodes = (language: string) => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const nodes: Text[] = [];

      while (true) {
        const next = walker.nextNode();
        if (!next) break;

        const textNode = next as Text;
        if (!canTranslateNode(textNode)) continue;
        if (language !== 'fr' && translatedLanguageRef.current.get(textNode) === language) continue;
        if (language === 'fr' && !originalsRef.current.get(textNode)) continue;
        nodes.push(textNode);
      }

      return nodes;
    };

    const collectAttributeItems = (language: string) => {
      const elements = Array.from(document.body.querySelectorAll<HTMLElement>('*'));
      const items: Array<{ element: Element; attribute: TranslatableAttribute }> = [];

      for (const element of elements) {
        if (!canTranslateElement(element)) continue;

        const translatedAttributes = attributeTranslatedLanguageRef.current.get(element) || {};
        const originalAttributes = attributeOriginalsRef.current.get(element) || {};

        for (const attribute of TRANSLATABLE_ATTRIBUTES) {
          const value = element.getAttribute(attribute) || '';
          if (!shouldTranslateText(value)) continue;
          if (language !== 'fr' && translatedAttributes[attribute] === language) continue;
          if (language === 'fr' && !originalAttributes[attribute]) continue;
          items.push({ element, attribute });
        }
      }

      return items;
    };

    const restoreOriginals = () => {
      collectTextNodes('fr').forEach((node) => {
        const original = originalsRef.current.get(node);
        if (original && node.nodeValue !== original) {
          node.nodeValue = original;
          translatedLanguageRef.current.delete(node);
        }
      });

      collectAttributeItems('fr').forEach(({ element, attribute }) => {
        const original = attributeOriginalsRef.current.get(element)?.[attribute];
        if (original && element.getAttribute(attribute) !== original) {
          element.setAttribute(attribute, original);
          const translatedAttributes = attributeTranslatedLanguageRef.current.get(element) || {};
          delete translatedAttributes[attribute];
          attributeTranslatedLanguageRef.current.set(element, translatedAttributes);
        }
      });
    };

    const translateTextNodes = async (language: string) => {
      const nodes = collectTextNodes(language);
      const batch = nodes.slice(0, MAX_ITEMS_PER_BATCH);

      for (const node of batch) {
        const currentText = (node.nodeValue || '').trim();
        if (!currentText) continue;

        const originalText = originalsRef.current.get(node) || currentText;
        originalsRef.current.set(node, originalText);

        try {
          const translated = await translateText(originalText, language);
          if (languageRef.current === language && node.isConnected) {
            node.nodeValue = (node.nodeValue || '').replace(currentText, translated);
            translatedLanguageRef.current.set(node, language);
          }
        } catch {
          // Keep original text.
        }
      }

      return nodes.length > batch.length;
    };

    const translateAttributeItems = async (language: string) => {
      const items = collectAttributeItems(language);
      const batch = items.slice(0, MAX_ITEMS_PER_BATCH);

      for (const { element, attribute } of batch) {
        const currentText = (element.getAttribute(attribute) || '').trim();
        if (!currentText) continue;

        const originalAttributes = attributeOriginalsRef.current.get(element) || {};
        const originalText = originalAttributes[attribute] || currentText;
        originalAttributes[attribute] = originalText;
        attributeOriginalsRef.current.set(element, originalAttributes);

        try {
          const translated = await translateText(originalText, language);
          if (languageRef.current === language && element.isConnected) {
            element.setAttribute(attribute, translated);
            const translatedAttributes = attributeTranslatedLanguageRef.current.get(element) || {};
            translatedAttributes[attribute] = language;
            attributeTranslatedLanguageRef.current.set(element, translatedAttributes);
          }
        } catch {
          // Keep original attribute.
        }
      }

      return items.length > batch.length;
    };

    const scheduleTranslation = () => {
      if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = setTimeout(() => {
        void translateVisibleText();
      }, 250);
    };

    const translateVisibleText = async () => {
      const language = languageRef.current;
      if (translatingRef.current) return;

      if (language === 'fr') {
        restoreOriginals();
        return;
      }

      translatingRef.current = true;
      try {
        const hasMoreText = await translateTextNodes(language);
        const hasMoreAttributes = await translateAttributeItems(language);
        if ((hasMoreText || hasMoreAttributes) && languageRef.current === language) {
          setTimeout(() => {
            translatingRef.current = false;
            scheduleTranslation();
          }, 100);
          return;
        }
      } finally {
        translatingRef.current = false;
      }
    };

    const handleLanguageChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ language?: string }>;
      languageRef.current = customEvent.detail?.language || 'fr';
      scheduleTranslation();
    };

    const observer = new MutationObserver(() => {
      if (languageRef.current !== 'fr') scheduleTranslation();
    });

    window.addEventListener('enkamba-dashboard-language-change', handleLanguageChange);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...TRANSLATABLE_ATTRIBUTES],
    });

    scheduleTranslation();

    return () => {
      window.removeEventListener('enkamba-dashboard-language-change', handleLanguageChange);
      observer.disconnect();
      if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
    };
  }, []);

  return null;
}
