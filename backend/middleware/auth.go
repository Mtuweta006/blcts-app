package middleware

import "os"

import (
	"context"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"blcts-backend/handlers"
)

type contextKey string

const (
	UserContextKey contextKey = "user_claims"
)

func getJWTSecret() []byte {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "BLCTS_DEV_FALLBACK_SECRET_CHANGE_IN_PRODUCTION"
	}
	return []byte(secret)
}

// UserClaims models standard system identities for the three BLCTS roles:
// administrator, facility_manager, building_owner
type UserClaims struct {
	UserID string `json:"user_id"`
	Email  string `json:"email"`
	Role   string `json:"role"` // administrator, facility_manager, building_owner
	jwt.RegisteredClaims
}

// EnsureJWT injects JWT authentication verification filters to secure endpoints
func EnsureJWT(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			handlers.SendError(w, http.StatusUnauthorized, "Missing Authorization header", "UNAUTHORIZED")
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			handlers.SendError(w, http.StatusUnauthorized, "Authorization format invalid. Must be 'Bearer <JWT_TOKEN>'", "MALFORMED_AUTH_HEADER")
			return
		}

		tokenString := parts[1]
		claims := &UserClaims{}

		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(getJWTSecret()), nil
		})

		if err != nil || !token.Valid {
			handlers.SendError(w, http.StatusUnauthorized, "Access Token has expired or signature is invalid", "INVALID_TOKEN")
			return
		}

		ctx := context.WithValue(r.Context(), UserContextKey, claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// RequireRole guards specific controller paths based on identity permissions.
// Enforces server-side RBAC — client-side hidden buttons are not sufficient.
// Returns HTTP 403 Forbidden if the user's role is not in the allowed list.
func RequireRole(allowedRoles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims, ok := r.Context().Value(UserContextKey).(*UserClaims)
			if !ok {
				handlers.SendError(w, http.StatusUnauthorized, "User context identity missing", "UNAUTHORIZED_CONTEXT")
				return
			}

			isAllowed := false
			for _, role := range allowedRoles {
				if strings.ToLower(claims.Role) == strings.ToLower(role) {
					isAllowed = true
					break
				}
			}

			if !isAllowed {
				handlers.SendError(w, http.StatusForbidden, "Forbidden: insufficient role permissions for this action", "FORBIDDEN")
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
