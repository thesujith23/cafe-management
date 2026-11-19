import { Component } from 'react';

// A rendering failure should show a way back, not a white screen.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Screen error:', error, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="lw-route-error" role="alert">
          <h1>Something went wrong</h1>
          <p>This screen hit an unexpected problem. Reloading usually sets the table again.</p>
          <button type="button" onClick={() => window.location.reload()}>Reload the page</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
