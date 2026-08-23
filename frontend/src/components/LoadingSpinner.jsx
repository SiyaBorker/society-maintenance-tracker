export default function LoadingSpinner({ full }) {
  return (
    <div className={full ? 'spinner-wrap spinner-wrap--full' : 'spinner-wrap'}>
      <div className="spinner" />
    </div>
  );
}
