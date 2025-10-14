
interface MatchCardErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

export function MatchCardErrorFallback({ error, resetError }: MatchCardErrorFallbackProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <div className="flex items-center mb-2">
        <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h4 className="text-sm font-medium text-red-800">
          Match Card Error
        </h4>
      </div>
      
      <p className="text-sm text-red-700 mb-3">
        This similarity match couldn't be displayed properly. The match data might be corrupted or incomplete.
      </p>
      
      <div className="flex space-x-2">
        <button
          onClick={resetError}
          className="bg-red-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Retry
        </button>
        <button
          onClick={() => {
            // This would typically hide the problematic match card
            resetError();
          }}
          className="bg-gray-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Hide
        </button>
      </div>
      
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs text-red-600 hover:text-red-800">
            Error Details
          </summary>
          <pre className="mt-1 text-xs text-red-600 bg-red-100 p-2 rounded overflow-auto max-h-32 whitespace-pre-wrap">
            {error.message}
            {error.stack && `\n\nStack Trace:\n${error.stack}`}
          </pre>
        </details>
      )}
    </div>
  );
}