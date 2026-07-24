import { Router } from 'preact-router';
import { lazy, Suspense } from 'preact/compat';
import { Header } from './components/layout/Header.jsx';
import { Home } from './pages/Home.jsx';
import { Loading } from './components/layout/Loading.jsx';

const QrCode = lazy(() => import('./pages/QrCode.jsx').then(m => ({ default: m.QrCode })));
const JsonTool = lazy(() => import('./pages/JsonTool.jsx').then(m => ({ default: m.JsonTool })));
const YamlTool = lazy(() => import('./pages/YamlTool.jsx').then(m => ({ default: m.YamlTool })));
const XmlTool = lazy(() => import('./pages/XmlTool.jsx').then(m => ({ default: m.XmlTool })));
const BrownNoise = lazy(() => import('./pages/BrownNoise.jsx').then(m => ({ default: m.BrownNoise })));

export function App() {
  return (
    <>
      <Header />
      <main>
        <Suspense fallback={<Loading />}>
          <Router>
            <Home path="/" />
            <QrCode path="/qr" />
            <JsonTool path="/json" />
            <YamlTool path="/yaml" />
            <XmlTool path="/xml" />
            <BrownNoise path="/brown-noise" />
          </Router>
        </Suspense>
      </main>
    </>
  );
}
