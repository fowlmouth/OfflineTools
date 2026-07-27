import { Router } from 'preact-router';
import { lazy, Suspense } from 'preact/compat';
import { Header } from './components/layout/Header.jsx';
import { Home } from './pages/Home.jsx';
import { Loading } from './components/layout/Loading.jsx';
import { route } from './utils/route.js';

const QrCode = lazy(() => import('./pages/QrCode.jsx').then(m => ({ default: m.QrCode })));
const DataTool = lazy(() => import('./pages/DataTool.jsx').then(m => ({ default: m.DataTool })));
const ImageEditor = lazy(() => import('./pages/ImageEditor.jsx').then(m => ({ default: m.ImageEditor })));
const BrownNoise = lazy(() => import('./pages/BrownNoise.jsx').then(m => ({ default: m.BrownNoise })));

export function App() {
  return (
    <>
      <Header />
      <main>
        <Suspense fallback={<Loading />}>
          <Router>
            <Home path={route('/')} />
            <QrCode path={route('/qr')} />
            <DataTool path={route('/data')} />
            <ImageEditor path={route('/image')} />
            <BrownNoise path={route('/brown-noise')} />
          </Router>
        </Suspense>
      </main>
    </>
  );
}
