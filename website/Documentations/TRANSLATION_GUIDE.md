# Automatic Translation Guide

## Overview

The app now supports automatic translation for all languages without manually creating translation files.

## How It Works

1. **Base Language**: English (`en.json`) serves as the base translation file
2. **Automatic Translation**: When a user selects a language that doesn't have a translation file, the app automatically translates all strings from English
3. **Caching**: Translations are cached in localStorage to avoid repeated API calls
4. **Fallback**: If translation fails, the app falls back to English

## Supported Languages

- ✅ **English (en)** - Base language
- ✅ **Kiswahili (kis/sw)** - Manual translations available
- ✅ **Français (fr)** - Auto-translated
- ✅ **Português (pt)** - Auto-translated
- ✅ **العربية (ar)** - Auto-translated
- ⚠️ **Yorùbá (yo)** - Limited support (falls back to English for complex phrases)
- ⚠️ **Hausa (ha)** - Limited support (falls back to English for complex phrases)
- ✅ **isiZulu (zu)** - Auto-translated

## Translation Service

### Current Implementation

- **API**: LibreTranslate (free and open-source)
- **Endpoint**: https://libretranslate.com/translate
- **Features**:
  - Free to use
  - No API key required
  - Privacy-friendly (can self-host)

### Alternative APIs

If you need better quality or more languages, consider these alternatives:

#### 1. Google Cloud Translation API

```javascript
// Install: npm install @google-cloud/translate
import { Translate } from "@google-cloud/translate";
const translate = new Translate({ key: "YOUR_API_KEY" });

async function translateText(text, target) {
  const [translation] = await translate.translate(text, target);
  return translation;
}
```

**Pros**: High quality, supports 100+ languages
**Cons**: Requires API key, costs money after free tier

#### 2. DeepL API

```javascript
// More accurate translations, especially for European languages
const DEEPL_API = "https://api-free.deepl.com/v2/translate";
```

**Pros**: Very high quality translations
**Cons**: Requires API key, limited free tier

#### 3. Microsoft Translator

```javascript
// Good for African languages
const AZURE_API = "https://api.cognitive.microsofttranslator.com/translate";
```

**Pros**: Good support for African languages
**Cons**: Requires Azure account and API key

## Usage

### For Developers

#### Adding New Translations to Base File

Add new keys to `locales/en.json`:

```json
{
  "New Key": "New English Text",
  "Another Key": "Another English Text"
}
```

All other languages will automatically get these translations.

#### Clearing Translation Cache

```javascript
import { clearTranslationCache } from "./utils/translationService";

// Clear specific language
clearTranslationCache("fr");

// Clear all languages
clearTranslationCache();
```

#### Manual Translation Override

If auto-translation quality isn't good enough for a specific language, create a manual file:

1. Create `locales/fr.json` (for French)
2. Copy all keys from `en.json`
3. Manually translate values
4. The app will use the manual file instead of auto-translating

### For Users

1. Go to Language Settings page
2. Select your preferred language
3. First time: Translations will be generated (may take 10-30 seconds)
4. Subsequent visits: Cached translations load instantly

## Configuration

### Change Translation API

Edit `utils/translationService.js`:

```javascript
// Use Google Translate instead
const GOOGLE_API = "https://translation.googleapis.com/language/translate/v2";

export const translateText = async (text, targetLang, sourceLang = "en") => {
  const response = await fetch(`${GOOGLE_API}?key=YOUR_API_KEY`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      q: text,
      source: sourceLang,
      target: targetLang,
      format: "text",
    }),
  });

  const data = await response.json();
  return data.data.translations[0].translatedText;
};
```

### Self-Hosting LibreTranslate

For production, consider self-hosting for better reliability:

```bash
# Using Docker
docker run -d -p 5000:5000 libretranslate/libretranslate

# Then update the API endpoint
const LIBRETRANSLATE_API = 'http://your-server:5000/translate';
```

## Best Practices

1. **Use English as Base**: Always maintain `en.json` with all keys
2. **Cache Management**: Clear cache when updating translations
3. **Error Handling**: App falls back to English if translation fails
4. **Manual Override**: For important languages (like Kiswahili), maintain manual translation files for better quality
5. **Test Translations**: Review auto-generated translations for cultural accuracy, especially for product names and brand terms

## Limitations

1. **API Rate Limits**: Free APIs may have rate limits
2. **Translation Quality**: Auto-translation may not capture cultural nuances
3. **Offline Mode**: Requires internet for first translation
4. **Context**: Machine translation may miss context-specific meanings

## Future Improvements

- [ ] Add translation pre-loading in the background
- [ ] Implement translation quality voting system
- [ ] Add professional translation service for premium languages
- [ ] Support right-to-left (RTL) languages properly (Arabic)
- [ ] Add translation memory for common phrases
- [ ] Implement fallback chain (e.g., French → English → default)

## Troubleshooting

### Translations not loading?

1. Check browser console for errors
2. Clear translation cache: `clearTranslationCache()`
3. Check internet connection
4. Verify API endpoint is accessible

### Poor translation quality?

1. Create manual translation file for that language
2. Switch to premium translation API (Google, DeepL)
3. Report issues for future manual translation improvements

### Slow first load?

1. Normal for first time (generating translations)
2. Consider pre-generating translations during build
3. Use faster translation API
4. Implement background translation loading

## Contact

For translation issues or to contribute manual translations:

- Open an issue on GitHub
- Contact support team
- Submit pull request with translation improvements
