import './Loading.css';

export function Loading() {
  return (
    <div class="loading" role="status" aria-label="Loading">
      <div class="loading-spinner" />
      <span class="loading-text">Loading tool&hellip;</span>
    </div>
  );
}
