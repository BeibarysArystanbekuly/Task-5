export default function LoadingState({ children = 'Loading page…' }) {
  return <div className="state" role="status"><span className="spinner" aria-hidden="true" />{children}</div>
}
