import type { APIRoute } from 'astro';

const AI_CRAWLERS = [
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot',
  'Applebot-Extended',
  'Amazonbot',
  'Bytespider',
  'CCBot',
  'Meta-ExternalAgent',
  'cohere-ai',
  'YouBot',
  'DuckAssistBot',
  'MistralAI-User',
];

export const GET: APIRoute = ({ site }) => {
  const origin = (site ?? new URL('https://yunma.fr')).origin;

  const body = [
    '# Yunma — cafés de spécialité du Yunnan',
    '# Les moteurs de recherche et les assistants IA sont les bienvenus.',
    '',
    'User-agent: *',
    'Allow: /',
    '',
    ...AI_CRAWLERS.flatMap((agent) => [`User-agent: ${agent}`, 'Allow: /', '']),
    `Sitemap: ${origin}/sitemap-index.xml`,
    `# Résumé lisible par les IA : ${origin}/llms.txt`,
    '',
  ].join('\n');

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
