import { Link } from 'preact-router/match';
import { route } from '../../utils/route.js';
import { useTheme } from '../../hooks/useTheme.js';
import { ThemeToggle } from './ThemeToggle.jsx';
import './Header.css';

const tools = [
  { href: route('/'), label: 'Home' },
  { href: route('/qr'), label: 'QR Code' },
  { href: route('/data'), label: 'Data Explorer' },
  { href: route('/image'), label: 'Image Editor' },
  { href: route('/brown-noise'), label: 'Brown Noise' },
  { href: route('/password'), label: 'Passwords' },
  { href: route('/color'), label: 'Color' },
];

export function Header() {
  const { theme, setTheme } = useTheme();

  return (
    <header class="header">
      <nav class="header-nav">
        {tools.map((tool) => (
          <Link href={tool.href} activeClassName="active">
            {tool.label}
          </Link>
        ))}
        <ThemeToggle theme={theme} setTheme={setTheme} />
      </nav>
    </header>
  );
}
