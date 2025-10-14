import { useParams } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";
import { validateUrl } from "../utils/validation";

export default function MockUrlPage() {
  const { encodedUrl } = useParams();
  usePageTitle("MockUrlPage");

  const displayUrl = (() => {
    if (!encodedUrl) return "No URL provided";
    
    try {
      const decoded = decodeURIComponent(encodedUrl);
      // Validate URL format (this will throw if invalid)
      validateUrl(decoded);
      return decoded;
    } catch (error) {
      console.warn("Invalid URL provided:", error);
      return "Invalid URL format";
    }
  })();

  return (
    <div className="w-full flex justify-center pt-10 px-4">
      <div className="max-w-xl w-full text-left">
        <h1 className="text-2xl font-semibold mb-4">Mocked URL</h1>
        <p className="text-gray-700 mb-4">
          This is a mocked-up URL for a prototype. In reality, you would navigate to the actual website.
        </p>
        <p className="text-sm text-gray-500 break-all">
          {displayUrl}
        </p>
      </div>
    </div>
  );
}