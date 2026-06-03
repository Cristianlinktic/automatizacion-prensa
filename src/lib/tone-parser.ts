import * as cheerio from 'cheerio';

export interface AnalysisResult {
  url: string;
  title: string;
  tone: string;
  emoji: string;
  status: 'success' | 'no_tone' | 'error';
  timestamp: string;
}

const EMOJI_MAP: Record<string, string> = {
  "green-smile": "😊",
  "serious_face_with_symbols_covering_mouth": "🤬",
  "no_mouth": "😶",
  "serious": "🤬", // Added based on earlier user input
};

export async function extractToneFromUrl(url: string): Promise<AnalysisResult> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 0 }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract Title
    let title = $('title').text().replace("IP Noticias - ", "").trim();
    if (!title) title = "Sin título";

    // Extract Tone - Specific structure provided by user:
    // <span class="ip-label">Tono</span>...<a title="Negativo"><i class="emoji_tono em em-serious_face_with_symbols_covering_mouth"></i></a>
    
    const toneLabel = $('.ip-label').filter((i, el) => $(el).text().trim() === 'Tono');
    const toneContainer = toneLabel.closest('.row').find('.col-sm-4').last();
    const toneAnchor = toneContainer.find('a[title]');
    const toneIcon = toneAnchor.find('i.emoji_tono');

    const toneVal = toneAnchor.attr('title');
    const iconClasses = toneIcon.attr('class') || '';
    
    // Extract emoji slug from class (e.g., em-green-smile)
    const emojiMatch = iconClasses.match(/em-([\w-]+)/);
    const emojiSlug = emojiMatch ? emojiMatch[1] : '';

    if (toneVal) {
      return {
        url,
        title,
        tone: toneVal,
        emoji: EMOJI_MAP[emojiSlug] || EMOJI_MAP[toneVal.toLowerCase()] || "❓",
        status: 'success',
        timestamp: new Date().toISOString()
      };
    }

    return {
      url,
      title,
      tone: "No especificado",
      emoji: "➖",
      status: 'no_tone',
      timestamp: new Date().toISOString()
    };

  } catch (error: any) {
    return {
      url,
      title: "Error al cargar",
      tone: "Error",
      emoji: "⚠️",
      status: 'error',
      timestamp: new Date().toISOString()
    };
  }
}
