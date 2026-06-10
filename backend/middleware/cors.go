package middleware

import "net/http"

// CORS establishes structural cross-origin access control rules
func CORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// FIX: Replaced wildcard "*" with your specific live domain under production deployments
		w.Header().Set("Access-Control-Allow-Origin", "https://blcts-dashboard.onrender.com")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Content-Length, Accept-Encoding")
		w.Header().Set("Access-Control-Allow-Credentials", "true")

		// Instantly satisfy HTTP preflight OPTIONS requests without routing overheads
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
