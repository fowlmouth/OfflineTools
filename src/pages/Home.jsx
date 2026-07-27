import { Link } from 'preact-router/match';
import { route } from '../utils/route.js';
import './Home.css';

const tools = [
  {
    href: route('/qr'),
    title: 'QR Code Generator',
    description: 'Generate QR codes for URLs, plain text, and contact cards (vCard).',
  },
  {
    href: route('/data'),
    title: 'Data Explorer',
    description: 'Validate, format, convert, and query JSON, YAML, and XML with auto-detection.',
  },
  {
    href: route('/image'),
    title: 'Image Editor',
    description: 'Resize, flip, rotate, crop, annotate, and filter images — all in your browser.',
  },
  {
    href: route('/brown-noise'),
    title: 'Brown Noise Generator',
    description: 'Continuous brown noise for focus and sleep, generated in your browser.',
  },
];

export function Home() {
  return (
    <div class="home">
      <div class="home-hero">
        <h1>Offline Tools</h1>
        <p>Browser-based utilities that work without an internet connection.</p>
      </div>
      <div class="tool-grid">
        {tools.map((tool) => (
          <Link href={tool.href} class="tool-card">
            <h2>{tool.title}</h2>
            <p>{tool.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
