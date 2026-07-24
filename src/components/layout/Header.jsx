import { Link } from 'preact-router/match';
import './Header.css';

const tools = [
  { href: '/', label: 'Home' },
  { href: '/qr', label: 'QR Code' },
  { href: '/json', label: 'JSON' },
  { href: '/yaml', label: 'YAML' },
  { href: '/xml', label: 'XML' },
  { href: '/brown-noise', label: 'Brown Noise' },
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
