import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Dashboard from "./Dashboard";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Index: Auth state', { user, loading });
    
    if (!loading && !user) {
      console.log('Index: Redirecting to auth');
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Show error if Supabase is not configured
  useEffect(() => {
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      setError('Configuration Supabase manquante. Vérifiez votre fichier .env');
    }
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg border border-red-200">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold text-red-800 mb-2">Erreur de configuration</h1>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="text-sm text-gray-600">
            <p>1. Copiez <code className="bg-gray-100 px-2 py-1 rounded">env.example</code> vers <code className="bg-gray-100 px-2 py-1 rounded">.env</code></p>
            <p>2. Remplissez vos clés Supabase</p>
            <p>3. Redémarrez l'app</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirection vers la connexion...</p>
        </div>
      </div>
    );
  }

  return <Dashboard />;
};

export default Index;
