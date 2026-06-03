import * as cheerio from 'cheerio';

export interface AnalysisResult {
  id?: string;
  url: string;
  title: string;
  tone: string;
  emoji: string;
  status: 'success' | 'no_tone' | 'error';
  timestamp: string;
  media?: string;
  type?: string;
  region?: string;
  summary?: string;
  tier?: string;
  costo_publicitario?: number;
  audiencia?: number;
  lecturabilidad?: number;
}

const EMOJI_MAP: Record<string, string> = {
  "green-smile": "😊",
  "serious_face_with_symbols_covering_mouth": "🤬",
  "no_mouth": "😶",
  "serious": "🤬",
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

    // Extract Media, Type, Region from specific IP structure if possible
    const media = $('.ip-label').filter((i, el) => $(el).text().trim() === 'Medio').closest('.row').find('.col-sm-4').last().text().trim() || "Desconocido";
    const type = $('.ip-label').filter((i, el) => $(el).text().trim() === 'Tipo').closest('.row').find('.col-sm-4').last().text().trim() || "Web";
    const region = $('.ip-label').filter((i, el) => $(el).text().trim() === 'Región').closest('.row').find('.col-sm-4').last().text().trim() || "Nacional";
    
    // Summary extraction (trying meta description first)
    const summary = $('meta[name="description"]').attr('content') || $('.article-body p').first().text().substring(0, 150) + "..." || "Sin resumen";

    // Extract Tone
    const toneLabel = $('.ip-label').filter((i, el) => $(el).text().trim() === 'Tono');
    const toneContainer = toneLabel.closest('.row').find('.col-sm-4').last();
    const toneAnchor = toneContainer.find('a[title]');
    const toneIcon = toneAnchor.find('i.emoji_tono');

    const toneVal = toneAnchor.attr('title');
    const iconClasses = toneIcon.attr('class') || '';
    
    const emojiMatch = iconClasses.match(/em-([\w-]+)/);
    const emojiSlug = emojiMatch ? emojiMatch[1] : '';

    if (toneVal) {
      return {
        url,
        title,
        tone: toneVal,
        emoji: EMOJI_MAP[emojiSlug] || EMOJI_MAP[toneVal.toLowerCase()] || "❓",
        status: 'success',
        timestamp: new Date().toISOString(),
        media,
        type,
        region,
        summary
      };
    }

    return {
      url,
      title,
      tone: "No especificado",
      emoji: "➖",
      status: 'no_tone',
      timestamp: new Date().toISOString(),
      media,
      type,
      region,
      summary
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
