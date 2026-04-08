/**
 * Translation Service
 * Handles automatic translation using LibreTranslate API (free and open-source)
 * Alternative: Google Translate API, DeepL, etc.
 */

const LIBRETRANSLATE_API = "https://libretranslate.com/translate";
// For production, consider self-hosting LibreTranslate or using paid APIs for better reliability

/**
 * Language code mapping for LibreTranslate
 */
const LANGUAGE_MAP = {
  en: "en",
  kis: "sw", // Swahili
  fr: "fr",
  pt: "pt",
  ar: "ar",
  yo: "en", // Yoruba not directly supported, fallback to English
  ha: "en", // Hausa not directly supported, fallback to English
  zu: "zu", // Zulu
};

/**
 * Translate text from source language to target language
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language code
 * @param {string} sourceLang - Source language code (default: 'en')
 * @returns {Promise<string>} - Translated text
 */
export const translateText = async (text, targetLang, sourceLang = "en") => {
  try {
    // Skip translation if target is same as source
    if (targetLang === sourceLang) {
      return text;
    }

    // Map to LibreTranslate language codes
    const source = LANGUAGE_MAP[sourceLang] || sourceLang;
    const target = LANGUAGE_MAP[targetLang] || targetLang;

    // If target language isn't supported, return original
    if (target === "en" && targetLang !== "en") {
      console.warn(
        `Translation not supported for ${targetLang}, using English`
      );
      return text;
    }

    const response = await fetch(LIBRETRANSLATE_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: text,
        source: source,
        target: target,
        format: "text",
      }),
    });

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`);
    }

    const data = await response.json();
    return data.translatedText || text;
  } catch (error) {
    console.error("Translation error:", error);
    // Return original text on error
    return text;
  }
};

/**
 * Translate an entire object/dictionary
 * @param {Object} translations - Object with key-value pairs to translate
 * @param {string} targetLang - Target language code
 * @param {string} sourceLang - Source language code (default: 'en')
 * @returns {Promise<Object>} - Translated object
 */
export const translateObject = async (
  translations,
  targetLang,
  sourceLang = "en"
) => {
  const translatedObject = {};

  try {
    // Create array of translation promises
    const translationPromises = Object.entries(translations).map(
      async ([key, value]) => {
        const translatedValue = await translateText(
          value,
          targetLang,
          sourceLang
        );
        return [key, translatedValue];
      }
    );

    // Wait for all translations to complete
    const results = await Promise.all(translationPromises);

    // Rebuild object from results
    results.forEach(([key, value]) => {
      translatedObject[key] = value;
    });

    return translatedObject;
  } catch (error) {
    console.error("Batch translation error:", error);
    return translations; // Return original on error
  }
};

/**
 * Get or generate translation for a specific language
 * @param {string} lang - Language code
 * @param {Object} baseTranslations - Base translations (usually English)
 * @returns {Promise<Object>} - Translations for the language
 */
export const getTranslations = async (lang, baseTranslations) => {
  try {
    // Try to load from cache/localStorage first
    const cacheKey = `translations_${lang}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    // If not cached, generate translations
    console.log(`Generating translations for ${lang}...`);
    const translations = await translateObject(baseTranslations, lang);

    // Cache the translations
    localStorage.setItem(cacheKey, JSON.stringify(translations));

    return translations;
  } catch (error) {
    console.error(`Error getting translations for ${lang}:`, error);
    return baseTranslations; // Fallback to base translations
  }
};

/**
 * Clear translation cache
 * @param {string} lang - Language code (optional, clears all if not provided)
 */
export const clearTranslationCache = (lang = null) => {
  if (lang) {
    localStorage.removeItem(`translations_${lang}`);
  } else {
    // Clear all translation caches
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("translations_")) {
        localStorage.removeItem(key);
      }
    });
  }
};

/**
 * Supported languages for automatic translation
 */
export const SUPPORTED_LANGUAGES = [
  { code: "en", supported: true },
  { code: "kis", supported: true }, // Swahili
  { code: "fr", supported: true },
  { code: "pt", supported: true },
  { code: "ar", supported: true },
  { code: "yo", supported: false }, // Limited support
  { code: "ha", supported: false }, // Limited support
  { code: "zu", supported: true },
];

export default {
  translateText,
  translateObject,
  getTranslations,
  clearTranslationCache,
  SUPPORTED_LANGUAGES,
};
