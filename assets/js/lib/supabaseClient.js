(() => {
    window.ergSupabaseReady = (async () => {
        const response = await fetch("/api/config");
        const config = await response.json();

        if (!response.ok) {
            throw new Error(config.error || "No se pudo cargar la configuración de Supabase.");
        }

        if (!window.supabase || typeof window.supabase.createClient !== "function") {
            throw new Error("No se pudo cargar la librería de Supabase. Comprueba tu conexión a internet.");
        }

        window.ergSupabase = window.supabase.createClient(config.url, config.anonKey);
        return window.ergSupabase;
    })();
})();