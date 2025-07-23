package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
)

type Prefix struct {
	ID     int             `json:"id"`
	CIDR   string          `json:"cidr"`
	Tags   json.RawMessage `json:"tags"`   // e.g., {"segment": "finance"}
	Status string          `json:"status"` // e.g., "active"
}

var db *sql.DB

func main() {
	var err error

	// Replace with environment variables or constants in production
	connStr := "postgres://pgadmin:L3arn!ng2C0d3MyWay@terraform-20250716025120718500000001.cuvkum4aa8cx.us-east-1.rds.amazonaws.com:5432/ipamdb?sslmode=require"

	db, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatalf("Error connecting to DB: %v", err)
	}
	defer db.Close()

	if err = db.Ping(); err != nil {
		log.Fatalf("Unable to reach DB: %v", err)
	}

	_, err = db.Exec(`CREATE TABLE IF NOT EXISTS prefixes (
		id SERIAL PRIMARY KEY,
		cidr VARCHAR(255),
		tags JSONB,
		status VARCHAR(50)
	)`)
	if err != nil {
		log.Fatalf("Failed to create table: %v", err)
	}

	router := gin.Default()

	// Logging & recovery middleware
	router.Use(gin.Logger())
	router.Use(gin.Recovery())

	// CORS configuration
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type"},
		AllowCredentials: true,
	}))

	// Routes
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})
	router.POST("/ipam/prefixes", allocatePrefix)
	router.GET("/ipam/prefixes", getPrefixes)

	log.Println("Server running on 0.0.0.0:8080")
	if err := router.Run("0.0.0.0:8080"); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}

func allocatePrefix(c *gin.Context) {
	var req struct {
		CIDR string          `json:"cidr"`
		Tags json.RawMessage `json:"tags"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err := db.Exec("INSERT INTO prefixes (cidr, tags, status) VALUES ($1, $2, $3)", req.CIDR, req.Tags, "active")
	if err != nil {
		log.Printf("DB insert error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to allocate prefix"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Prefix allocated", "cidr": req.CIDR})
}

func getPrefixes(c *gin.Context) {
	rows, err := db.Query("SELECT id, cidr, tags
