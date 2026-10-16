import { Component } from 'react'

export default class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    console.error('VetAlert route failed to render or load:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="mx-auto max-w-lg rounded-xl border border-red-200 bg-red-50 px-5 py-8 text-center"
          role="alert"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-red-700">
            Load failed
          </p>
          <h2 className="mt-2 text-base font-semibold text-red-800">
            We couldn’t load this page
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-red-700">
            The page may have failed to download, or the connection was
            interrupted. Reloading the app usually fixes this.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              Reload the app
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => window.location.assign('/')}
            >
              Back to home
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}