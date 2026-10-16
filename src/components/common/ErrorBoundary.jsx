import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Catches render errors and failed lazy-chunk loads (for example after a new
 * deployment or while offline) so one broken section never blanks the page.
 */
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    console.error('[SkyVault] UI error:', error);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="glass-panel flex flex-col items-center gap-3 px-6 py-10 text-center">
        <AlertTriangle className="text-amber-400" size={28} aria-hidden="true" />
        <p className="max-w-sm text-sm text-slate-300">{this.props.message ?? 'This section failed to load.'}</p>
        <button
          type="button"
          onClick={this.reset}
          className="focus-ring inline-flex items-center gap-2 rounded-full bg-sky-500/20 px-4 py-2 text-sm font-medium text-sky-300 transition-colors hover:bg-sky-500/30"
        >
          <RefreshCw size={15} aria-hidden="true" /> Try again
        </button>
      </div>
    );
  }
}
