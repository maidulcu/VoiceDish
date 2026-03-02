package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var db *gorm.DB

type Order struct {
	ID          uint           `gorm:"primarykey" json:"id"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
	CustomerID  string         `gorm:"index" json:"customer_id"`
	PhoneNumber string         `json:"phone_number"`
	Transcript  string         `gorm:"type:text" json:"transcript"`
	OrderJSON   string         `gorm:"type:jsonb" json:"order_json"`
	Status      string         `gorm:"default:'pending'" json:"status"`
	Total       string         `json:"total"`
}

func initDB() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Println("DATABASE_URL not set, using SQLite for development")
		dsn = "./voicedish.db"
		db, _ = gorm.Open(sqlite.Open(dsn), &gorm.Config{})
	} else {
		var err error
		db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
		if err != nil {
			log.Fatalf("Failed to connect to database: %v", err)
		}
	}

	db.AutoMigrate(&Order{})
	log.Println("Database connected and migrated")
}

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	initDB()

	r := gin.Default()

	r.GET("/health", healthCheck)
	r.GET("/webhook", webhookVerification)
	r.POST("/webhook", webhookHandler)

	r.GET("/api/orders", getOrders)
	r.PUT("/api/orders/:id", updateOrderStatus)
	r.GET("/api/orders/stream", orderStream)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func healthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "VoiceDish backend is running!",
	})
}

func webhookVerification(c *gin.Context) {
	mode := c.Query("hub.mode")
	token := c.Query("hub.verify_token")
	challenge := c.Query("hub.challenge")

	verifyToken := os.Getenv("VERIFY_TOKEN")
	if verifyToken == "" {
		verifyToken = "my_secure_token_123"
	}

	if mode == "subscribe" && token == verifyToken {
		log.Println("Webhook verified successfully")
		c.String(http.StatusOK, challenge)
		return
	}

	log.Printf("Webhook verification failed: mode=%s, token=%s", mode, token)
	c.String(http.StatusForbidden, "Forbidden")
}

func webhookHandler(c *gin.Context) {
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		log.Printf("Error reading request body: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	fmt.Printf("Webhook payload: %s\n", string(body))

	var payload map[string]interface{}
	if err := c.ShouldBindJSON(&payload); err != nil {
		log.Printf("Error parsing JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
		return
	}

	entry, ok := payload["entry"].([]interface{})
	if !ok || len(entry) == 0 {
		c.JSON(http.StatusOK, gin.H{"status": "received"})
		return
	}

	entryMap, ok := entry[0].(map[string]interface{})
	if !ok {
		c.JSON(http.StatusOK, gin.H{"status": "received"})
		return
	}

	changes, ok := entryMap["changes"].([]interface{})
	if !ok || len(changes) == 0 {
		c.JSON(http.StatusOK, gin.H{"status": "received"})
		return
	}

	changesMap, ok := changes[0].(map[string]interface{})
	if !ok {
		c.JSON(http.StatusOK, gin.H{"status": "received"})
		return
	}

	value, ok := changesMap["value"].(map[string]interface{})
	if !ok {
		c.JSON(http.StatusOK, gin.H{"status": "received"})
		return
	}

	processMessage(value)

	c.JSON(http.StatusOK, gin.H{"status": "received"})
}

func processMessage(value map[string]interface{}) {
	messages, ok := value["messages"].([]interface{})
	if !ok || len(messages) == 0 {
		return
	}

	for _, msg := range messages {
		msgMap, ok := msg.(map[string]interface{})
		if !ok {
			continue
		}

		msgType, _ := msgMap["type"].(string)
		from, _ := msgMap["from"].(string)

		log.Printf("Received message from %s: type=%s", from, msgType)

		switch msgType {
		case "audio":
			handleAudioMessage(msgMap, from)
		case "text":
			handleTextMessage(msgMap, from)
		default:
			log.Printf("Unhandled message type: %s", msgType)
		}
	}
}

func handleAudioMessage(msg map[string]interface{}, from string) {
	audio, ok := msg["audio"].(map[string]interface{})
	if !ok {
		log.Println("Audio data not found")
		return
	}

	fileID, ok := audio["id"].(string)
	if !ok {
		log.Println("Audio file ID not found")
		return
	}

	log.Printf("Audio message from %s, file ID: %s", from, fileID)

	transcription, err := transcribeAudio(fileID)
	if err != nil {
		log.Printf("Transcription error: %v", err)
		sendWhatsAppMessage(from, "Sorry, I couldn't process your audio. Please try again.")
		return
	}

	log.Printf("Transcription: %s", transcription)

	orderJSON, total, err := extractOrder(transcription)
	if err != nil {
		log.Printf("Order extraction error: %v", err)
		sendWhatsAppMessage(from, "Sorry, I couldn't understand your order. Please try again.")
		return
	}

	log.Printf("Extracted order: %s", orderJSON)

	savedOrder := saveOrder(from, from, transcription, orderJSON, total)
	if savedOrder != nil {
		sendWhatsAppMessage(from, fmt.Sprintf("Order #%d received: %s", savedOrder.ID, orderJSON))
	} else {
		sendWhatsAppMessage(from, fmt.Sprintf("Order received: %s", orderJSON))
	}
}

func handleTextMessage(msg map[string]interface{}, from string) {
	text, ok := msg["text"].(map[string]interface{})
	if !ok {
		return
	}

	body, ok := text["body"].(string)
	if !ok {
		return
	}

	log.Printf("Text message from %s: %s", from, body)

	if body == "order" || body == "Order" {
		sendWhatsAppMessage(from, "Please send a voice message with your order.")
		return
	}

	orderJSON, total, err := extractOrder(body)
	if err != nil {
		log.Printf("Order extraction error: %v", err)
		sendWhatsAppMessage(from, "Sorry, I couldn't understand your order. Please try again.")
		return
	}

	log.Printf("Extracted order: %s", orderJSON)

	savedOrder := saveOrder(from, from, body, orderJSON, total)
	if savedOrder != nil {
		sendWhatsAppMessage(from, fmt.Sprintf("Order #%d received: %s", savedOrder.ID, orderJSON))
	} else {
		sendWhatsAppMessage(from, fmt.Sprintf("Order received: %s", orderJSON))
	}
}

func transcribeAudio(fileID string) (string, error) {
	apiKey := os.Getenv("GROQ_API_KEY")
	if apiKey == "" {
		return "", fmt.Errorf("GROQ_API_KEY not configured")
	}

	audioData, err := downloadWhatsAppMedia(fileID)
	if err != nil {
		return "", fmt.Errorf("failed to download audio: %w", err)
	}

	url := "https://api.groq.com/openai/v1/audio/transcriptions"

	body := &bytes.Buffer{}
	writer := NewMultipartWriter(body)
	writer.WriteField("model", "whisper-large-v3")
	writer.WriteField("response_format", "text")
	writer.CreateFormFile("file", "audio.ogg", audioData)
	writer.Close()

	client := &http.Client{}
	req, err := http.NewRequest("POST", url, body)
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("Groq API error: %s - %s", resp.Status, string(respBody))
	}

	return string(respBody), nil
}

func downloadWhatsAppMedia(fileID string) ([]byte, error) {
	token := os.Getenv("WHATSAPP_TOKEN")
	if token == "" {
		return nil, fmt.Errorf("WHATSAPP_TOKEN not configured")
	}

	url := fmt.Sprintf("https://graph.facebook.com/v21.0/%s", fileID)

	client := &http.Client{}
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("WhatsApp media API error: %s", resp.Status)
	}

	var mediaResp map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&mediaResp); err != nil {
		return nil, err
	}

	mediaURL, ok := mediaResp["url"].(string)
	if !ok {
		return nil, fmt.Errorf("media URL not found in response")
	}

	req, err = http.NewRequest("GET", mediaURL, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+token)

	resp, err = client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to download media: %s", resp.Status)
	}

	return io.ReadAll(resp.Body)
}

type MultipartWriter struct {
	writer *io.PipeWriter
	reader *io.PipeReader
}

func NewMultipartWriter(body *bytes.Buffer) *MultipartWriter {
	reader, writer := io.Pipe()
	return &MultipartWriter{writer: writer, reader: reader}
}

func (m *MultipartWriter) WriteField(key, value string) {
	m.writer.Write([]byte(fmt.Sprintf("-- boundary\r\nContent-Disposition: form-data; name=\"%s\"\r\n\r\n%s\r\n", key, value)))
}

func (m *MultipartWriter) CreateFormFile(fieldName, fileName string, data []byte) {
	m.writer.Write([]byte(fmt.Sprintf("--boundary\r\nContent-Disposition: form-data; name=\"%s\"; filename=\"%s\"\r\nContent-Type: audio/ogg\r\n\r\n", fieldName, fileName)))
	m.writer.Write(data)
	m.writer.Write([]byte("\r\n"))
}

func (m *MultipartWriter) Close() error {
	m.writer.Write([]byte("--boundary--\r\n"))
	return m.writer.Close()
}

func (m *MultipartWriter) FormDataContentType() string {
	return "multipart/form-data; boundary=boundary"
}

func extractOrder(transcript string) (string, string, error) {
	apiKey := os.Getenv("GROQ_API_KEY")
	if apiKey == "" {
		return "", "", fmt.Errorf("GROQ_API_KEY not configured")
	}

	url := "https://api.groq.com/openai/v1/chat/completions"

	systemPrompt := `You are a restaurant order extraction assistant. Extract the order from the customer's message and return ONLY a JSON object with the following structure:
{
  "items": [{"name": "item name", "quantity": number, "notes": "any special instructions"}],
  "total": "estimated total in AED"
}

If you cannot extract a valid order, return: {"items": [], "total": "0", "error": "Could not understand order"}`

	payload := map[string]interface{}{
		"model": "llama-3.3-70b-versatile",
		"messages": []map[string]string{
			{"role": "system", "content": systemPrompt},
			{"role": "user", "content": transcript},
		},
		"temperature": 0.3,
	}

	client := &http.Client{}
	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return "", "", fmt.Errorf("failed to marshal payload: %w", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonPayload))
	if err != nil {
		return "", "", fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return "", "", fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", "", fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", "", fmt.Errorf("Groq API error: %s - %s", resp.Status, string(respBody))
	}

	var response map[string]interface{}
	if err := json.Unmarshal(respBody, &response); err != nil {
		return "", "", fmt.Errorf("failed to parse response: %w", err)
	}

	choices, ok := response["choices"].([]interface{})
	if !ok || len(choices) == 0 {
		return "", "", fmt.Errorf("no choices in response")
	}

	choice, ok := choices[0].(map[string]interface{})
	if !ok {
		return "", "", fmt.Errorf("invalid choice format")
	}

	message, ok := choice["message"].(map[string]interface{})
	if !ok {
		return "", "", fmt.Errorf("invalid message format")
	}

	content, ok := message["content"].(string)
	if !ok {
		return "", "", fmt.Errorf("invalid content format")
	}

	var orderData map[string]interface{}
	if err := json.Unmarshal([]byte(content), &orderData); err != nil {
		return content, "0", nil
	}

	total, _ := orderData["total"].(string)
	if total == "" {
		total = "0"
	}

	return content, total, nil
}

func sendWhatsAppMessage(to string, body string) {
	phoneID := os.Getenv("WHATSAPP_PHONE_ID")
	token := os.Getenv("WHATSAPP_TOKEN")

	if phoneID == "" || token == "" {
		log.Println("WhatsApp credentials not configured")
		return
	}

	url := fmt.Sprintf("https://graph.facebook.com/v21.0/%s/messages", phoneID)

	payload := map[string]interface{}{
		"messaging_product": "whatsapp",
		"to":                to,
		"type":              "text",
		"text": map[string]string{
			"body": body,
		},
	}

	client := &http.Client{}
	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		log.Printf("Error marshaling payload: %v", err)
		return
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonPayload))
	if err != nil {
		log.Printf("Error creating request: %v", err)
		return
	}

	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Error sending message: %v", err)
		return
	}
	defer resp.Body.Close()

	log.Printf("WhatsApp message sent, status: %d", resp.StatusCode)
}

func getOrders(c *gin.Context) {
	var orders []Order
	if err := db.Order("created_at DESC").Find(&orders).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, orders)
}

func updateOrderStatus(c *gin.Context) {
	id := c.Param("id")
	var order Order
	if err := db.First(&order, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	var updateData struct {
		Status string `json:"status"`
	}
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	order.Status = updateData.Status
	if err := db.Save(&order).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, order)
}

func saveOrder(customerID, phoneNumber, transcript, orderJSON, total string) *Order {
	order := Order{
		CustomerID:  customerID,
		PhoneNumber: phoneNumber,
		Transcript:  transcript,
		OrderJSON:   orderJSON,
		Status:      "pending",
		Total:       total,
	}

	if err := db.Create(&order).Error; err != nil {
		log.Printf("Error saving order: %v", err)
		return nil
	}

	log.Printf("Order saved: ID=%d", order.ID)
	return &order
}

func orderStream(c *gin.Context) {
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("Access-Control-Allow-Origin", "*")

	notify := c.Request.Context().Done()

	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	var lastID uint
	c.JSON(http.StatusOK, gin.H{"message": "Connected to order stream"})

	for {
		select {
		case <-notify:
			return
		case <-ticker.C:
			var orders []Order
			if err := db.Where("id > ?", lastID).Order("id DESC").Find(&orders).Error; err == nil && len(orders) > 0 {
				lastID = orders[0].ID
				for _, order := range orders {
					data, _ := json.Marshal(order)
					c.SSEvent("order", string(data))
					c.Writer.Flush()
				}
			}
		}
	}
}
