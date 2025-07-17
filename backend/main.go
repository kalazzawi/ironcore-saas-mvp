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
	ID   int             `json:"id"`
	CIDR string          `json:"cidr"`
	Tags json.RawMessage `json:"tags"` // e.g., {"segment": "finance"}
}

var db *sql.DB

func main() {
	// Connect to your AWS RDS PostgreSQL (replace placeholders)
	var err error
	db, err = sql.Open("postgres", "postgres://pgadmin:L3arn!ng2C0d3MyWay@terraform-20250716025120718500000001.cuvkum4aa8cx.us-east-1.rds.amazonaws.com:5432/ipamdb?sslmode=require")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	// Create the table if it doesn't exist (run once)
	_, err = db.Exec(`CREATE TABLE IF NOT EXISTS prefixes (
        id SERIAL PRIMARY KEY,
        cidr VARCHAR(255),
        tags JSONB,
        status VARCHAR(50)
    )`)
	if err != nil {
		log.Fatal(err)
	}

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{"http://localhost:3000"}, // Your frontend origin
		AllowMethods: []string{"GET", "POST", "OPTIONS"},
		AllowHeaders: []string{"Origin", "Content-Type"},
	}))

	// Endpoint: Allocate a new prefix
	r.POST("/ipam/prefixes", allocatePrefix)

	// Endpoint: Get all prefixes
	r.GET("/ipam/prefixes", getPrefixes)

	r.Run(":8080") // Runs on http://localhost:8080
}

func allocatePrefix(c *gin.Context) {
	var req struct {
		CIDR string          `json:"cidr"`
		Tags json.RawMessage `json:"tags"`
	}
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Insert into DB (basic; add IP validation later)
	_, err := db.Exec("INSERT INTO prefixes (cidr, tags, status) VALUES ($1, $2, $3)", req.CIDR, req.Tags, "active")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to allocate"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Prefix allocated", "cidr": req.CIDR})
}

func getPrefixes(c *gin.Context) {
	rows, err := db.Query("SELECT id, cidr, tags FROM prefixes")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var prefixes []Prefix
	for rows.Next() {
		var p Prefix
		if err := rows.Scan(&p.ID, &p.CIDR, &p.Tags); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		prefixes = append(prefixes, p)
	}

	c.JSON(http.StatusOK, prefixes)
}
