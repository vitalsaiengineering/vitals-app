
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-apple-gray animate-fade-in">
      <div className="text-center glass-effect p-12 rounded-2xl max-w-md mx-auto">
        <h1 className="text-6xl font-semibold mb-6">404</h1>
        <p className="text-xl text-muted-foreground mb-8">
          The page you're looking for cannot be found.
        </p>
        <Link
          to="/"
          className="inline-flex items-center text-apple-blue hover:text-apple-darkBlue transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
