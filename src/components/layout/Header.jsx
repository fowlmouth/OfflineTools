import { Link } from 'preact-router/match';
import { route } from '../../utils/route.js';
import './Header.css';

const tools = [
  { href: route('/'), label: 'Home' },
  { href: route('/qr'), label: 'QR Code' },
  { href: route('/data'), label: 'Data Explorer' },
  { href: route('/brown-noise'), label: 'Brown Noise' },
];

export function Header() {
  return (
    <header class="header">
      <nav class="header-nav">
        {tools.map((tool) => (
          <Link href={tool.href} activeClassName="active">
            {tool.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
