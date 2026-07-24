import { Loading } from './Loading.jsx';
import './ToolPage.css';

export function ToolPage({ title, description, loading, error, children }) {
  return (
    <div class="tool-page">
      <div class="tool-page-header">
        <h1>{title}</h1>
        {description && <p class="tool-page-desc">{description}</p>}
      </div>
      {loading && <Loading />}
      {error && (
        <div class="tool-page-error" role="alert">
          Failed to load tool: {error.message}
        </div>
      )}
      {!loading && !error && (
        <div class="tool-page-content">{children}</div>
      )}
    </div>
  );
}
