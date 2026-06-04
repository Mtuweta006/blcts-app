package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/username/blcts-backend/config"
	"github.com/username/blcts-backend/handlers"
	customMiddleware "github.com/username/blcts-backend/middleware"
)

func main() {
	// Initialize logging
	log.SetFlags(log.LstdFlags | log.Lshortfile)
	log.Println("Starting BLCTS Core Backend Enterprise Architecture...")

	// 1. Establish PostgreSQL Connection Pool handles (with automatic fallback to mock logs if connection fails)
	var dbPool handlers.DBConnectionPool
	db, err := config.ConnectDatabase()
	if err != nil {
		log.Printf("DATABASE CONFIG WARNING: %s\n", err.Error())
		log.Println("⚡ Running in sandbox development mode with in-memory persistence models.")
	} else {
		log.Println("🚀 Concurrency database pool successfully linked to PostgreSQL.")
		dbPool = db
		defer db.Pool.Close()
	}

	// 2. Initialize HTTP Handler Dependencies container
	deps := &handlers.HandlerDeps{
		DB: dbPool,
	}

	// 3. Configure HTTP routing via Chi
	r := chi.NewRouter()

	// Implement industry standard middleware stacks
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(60 * time.Second))
	r.Use(customMiddleware.CORS)

	// Public Health Probes
	r.Get("/api/health", func(w http.ResponseWriter, req *http.Request) {
		status := "healthy"
		if dbPool == nil {
			status = "degraded (mock active)"
		}
		handlers.SendJSON(w, http.StatusOK, map[string]interface{}{
			"status":    status,
			"timestamp": time.Now().Format(time.RFC3339),
			"version":   "1.0.0",
		})
	})

	// Public Metrics / Visualization route (safe read-only display logs used by Chart.js graphs)
	r.Get("/api/dashboard/{building_id}", deps.HandleGetDashboard)

	// ==========================================
	// NEW: Trigger Safaricom STK Push
	// ==========================================
	r.Post("/api/maintenance/{task_id}/stk", deps.HandleInitiateSTKPush)

	// Secured API Endpoint Router Groups protected by cryptographic JSON Web Token verified handles
	// THE FIX IS HERE: Changed 'secured r.RouteReceiver' to 'secured chi.Router'
	r.Group(func(secured chi.Router) {
		// Apply JWT Verification and strict Role Privilege Guards (owner/manager/staff)
		secured.Use(customMiddleware.EnsureJWT)

		// Create invoice entries inside ledger (requires role permission to write logs)
		secured.With(customMiddleware.RequireRole("owner", "manager")).Post("/api/costs", deps.HandleCreateCost)

		// Disburse actual contractor pay outs via M-Pesa sandbox integration
		secured.With(customMiddleware.RequireRole("owner")).Post("/api/maintenance/{task_id}/pay", deps.HandleDisburseContractorMpesa)
	})

	// 4. Server configuration binding to host environment interfaces
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // Default non-blocking backend channel
	}
	serverAddr := fmt.Sprintf("0.0.0.0:%s", port)

	server := &http.Server{
		Addr:         serverAddr,
		Handler:      r,
		ReadTimeout:  15 * time.Minute,
		WriteTimeout: 15 * time.Minute,
		IdleTimeout:  2 * time.Minute,
	}

	// 5. Build Graceful Server Shutdown mechanics listening to system interrupts
	shutdownChan := make(chan os.Signal, 1)
	signal.Notify(shutdownChan, os.Interrupt, syscall.SIGTERM, syscall.SIGINT)

	go func() {
		log.Printf("Server listening actively on: http://%s\n", serverAddr)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Critical listener breakdown: %s\n", err.Error())
		}
	}()

	// Block thread until interrupt signal arrives
	sig := <-shutdownChan
	log.Printf("Graceful shutdown sequence triggered on signal: %s\n", sig)

	// Formulate 15 second context limit for pending database/HTTP loops to drain safely
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("Forced server exit: %s\n", err.Error())
	}

	log.Println("Server is gracefully halted. Clean transition complete.")
}
