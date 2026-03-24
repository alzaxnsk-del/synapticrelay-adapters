package sdk

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"
)

type RunContext map[string]interface{}

type SupplierClient struct {
	agentID         string
	apiKey          string
	apiURL          string
	pollingInterval time.Duration
	handler         func(RunContext) (interface{}, error)
	httpClient      *http.Client
	isPolling       bool
}

type clientOptions struct {
	apiURL          string
	pollingInterval time.Duration
}

type ClientOption func(*clientOptions)

// WithAPIURL configures a custom API endpoint
func WithAPIURL(url string) ClientOption {
	return func(o *clientOptions) {
		o.apiURL = url
	}
}

// WithPollingInterval configures a custom polling interval
func WithPollingInterval(seconds int) ClientOption {
	return func(o *clientOptions) {
		o.pollingInterval = time.Duration(seconds) * time.Second
	}
}

// NewSupplierClient creates a new configured SupplierClient
func NewSupplierClient(agentID, apiKey string, opts ...ClientOption) *SupplierClient {
	options := &clientOptions{
		apiURL:          "https://synapticrelay.com/api/v1/agent/action",
		pollingInterval: 30 * time.Second,
	}

	for _, opt := range opts {
		opt(options)
	}

	return &SupplierClient{
		agentID:         agentID,
		apiKey:          apiKey,
		apiURL:          options.apiURL,
		pollingInterval: options.pollingInterval,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// OnTask registers the developer's handler function
func (c *SupplierClient) OnTask(handler func(RunContext) (interface{}, error)) {
	c.handler = handler
}

// StartPolling begins the infinite polling loop, blocking the current goroutine
func (c *SupplierClient) StartPolling() {
	if c.handler == nil {
		log.Fatal("No task handler registered. Call OnTask() before StartPolling().")
	}

	c.isPolling = true
	log.Printf("[SynapticRelay] Started polling for agent %s every %v", c.agentID, c.pollingInterval)

	ticker := time.NewTicker(c.pollingInterval)
	defer ticker.Stop()

	// Initial poll immediately
	c.pollOnce()

	for c.isPolling {
		<-ticker.C
		c.pollOnce()
	}
}

// StopPolling halts the polling loop
func (c *SupplierClient) StopPolling() {
	c.isPolling = false
}

func (c *SupplierClient) pollOnce() {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("[SynapticRelay] Recovered from panic in polling loop: %v", r)
		}
	}()

	var runs []RunContext

	// 1. Fetch queued runs
	respData, err := c.apiCall("get_supplier_runs", map[string]interface{}{
		"supplierAgentId": c.agentID,
		"status":          "queued",
	})
	if err != nil {
		log.Printf("[SynapticRelay] Error fetching runs: %v", err)
		return
	}

	// Try to parse the response as an array of RunContext
	if err := extractRuns(respData, &runs); err != nil {
		log.Printf("[SynapticRelay] Error extracting runs from response: %v", err)
		return
	}

	if len(runs) == 0 {
		return
	}

	for _, run := range runs {
		runIDStr := ""
		if id, ok := run["id"].(string); ok && id != "" {
			runIDStr = id
		} else if id, ok := run["runId"].(string); ok && id != "" {
			runIDStr = id
		}

		if runIDStr == "" {
			continue
		}

		// 2. Start the run
		_, err := c.apiCall("start_run", map[string]interface{}{
			"runId": runIDStr,
		})
		if err != nil {
			log.Printf("[SynapticRelay] Error starting run %s: %v", runIDStr, err)
			continue
		}

		// 3. Execute developer handler
		deliveryPayload, err := c.handler(run)
		if err != nil {
			log.Printf("[SynapticRelay] Run %s failed during execution: %v", runIDStr, err)
			deliveryPayload = map[string]string{"error": err.Error()}
		}

		// 4. Deliver result
		_, err = c.apiCall("deliver_result", map[string]interface{}{
			"runId":           runIDStr,
			"deliveryPayload": deliveryPayload,
		})
		if err != nil {
			log.Printf("[SynapticRelay] Error delivering result for run %s: %v", runIDStr, err)
		}
	}
}

func (c *SupplierClient) apiCall(action string, params interface{}) ([]byte, error) {
	reqBody := map[string]interface{}{
		"action": action,
		"params": params,
	}

	jsonBytes, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequest("POST", c.apiURL, bytes.NewBuffer(jsonBytes))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Key", c.apiKey)
	req.Header.Set("User-Agent", "SynapticRelay-SDK/golang-1.0")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		bodyText, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API call %s failed with status %d: %s", action, resp.StatusCode, string(bodyText))
	}

	if resp.StatusCode == http.StatusNoContent {
		return []byte{}, nil
	}

	return io.ReadAll(resp.Body)
}

func extractRuns(data []byte, target *[]RunContext) error {
	if len(data) == 0 {
		return nil
	}

	// First try decoding as a direct array
	var directArray []RunContext
	if err := json.Unmarshal(data, &directArray); err == nil {
		*target = append(*target, directArray...)
		return nil
	}

	// Then try as wrapped object
	var wrappedObj map[string]interface{}
	if err := json.Unmarshal(data, &wrappedObj); err == nil {
		// Attempt to navigate data.data.runs
		if data1, ok := wrappedObj["data"].(map[string]interface{}); ok {
			if data2, ok := data1["data"].(map[string]interface{}); ok {
				if runsRaw, ok := data2["runs"]; ok {
					runsData, _ := json.Marshal(runsRaw)
					return json.Unmarshal(runsData, target)
				}
			}
		}
		
		// Attempt to navigate direct runs key
		if runsRaw, ok := wrappedObj["runs"]; ok {
			runsData, _ := json.Marshal(runsRaw)
			return json.Unmarshal(runsData, target)
		}
	}

	return fmt.Errorf("could not parse response into []RunContext")
}
