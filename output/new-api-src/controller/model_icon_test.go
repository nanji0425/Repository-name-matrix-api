package controller

import (
	"bytes"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestInspectModelIconAcceptsSupportedImageTypes(t *testing.T) {
	tests := []struct {
		name string
		data []byte
		ext  string
	}{
		{name: "png", data: []byte("\x89PNG\r\n\x1a\n"), ext: ".png"},
		{name: "jpeg", data: []byte{0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10}, ext: ".jpg"},
		{name: "webp", data: []byte("RIFF\x00\x00\x00\x00WEBP"), ext: ".webp"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got, err := inspectModelIcon(tt.data); err != nil || got != tt.ext {
				t.Fatalf("inspectModelIcon() = %q, %v; want %q, nil", got, err, tt.ext)
			}
		})
	}
}

func TestInspectModelIconRejectsUnsupportedOrOversizedFiles(t *testing.T) {
	if _, err := inspectModelIcon([]byte("not an image")); err == nil {
		t.Fatal("inspectModelIcon() accepted unsupported content")
	}
	if _, err := inspectModelIcon(bytes.Repeat([]byte("x"), maxModelIconBytes+1)); err == nil {
		t.Fatal("inspectModelIcon() accepted an oversized file")
	}
}

func TestUploadModelIconPersistsFileAndReturnsRelativeURL(t *testing.T) {
	gin.SetMode(gin.TestMode)
	t.Setenv("MODEL_ICON_DIR", t.TempDir())

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, err := writer.CreateFormFile("file", "client-name.png")
	if err != nil {
		t.Fatal(err)
	}
	if _, err := part.Write([]byte("\x89PNG\r\n\x1a\n")); err != nil {
		t.Fatal(err)
	}
	if err := writer.Close(); err != nil {
		t.Fatal(err)
	}

	req := httptest.NewRequest(http.MethodPost, "/api/models/icon", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = req

	UploadModelIcon(ctx)
	if recorder.Code != http.StatusOK {
		t.Fatalf("UploadModelIcon() status = %d, body = %s", recorder.Code, recorder.Body.String())
	}
	if !strings.Contains(recorder.Body.String(), "/model-icons/") {
		t.Fatalf("UploadModelIcon() response does not contain a model icon URL: %s", recorder.Body.String())
	}

	entries, err := os.ReadDir(modelIconStorageDir())
	if err != nil {
		t.Fatal(err)
	}
	if len(entries) != 1 || filepath.Ext(entries[0].Name()) != ".png" {
		t.Fatalf("stored files = %#v; want one generated .png file", entries)
	}
	stored, err := os.Open(filepath.Join(modelIconStorageDir(), entries[0].Name()))
	if err != nil {
		t.Fatal(err)
	}
	defer stored.Close()
	data, err := io.ReadAll(stored)
	if err != nil {
		t.Fatal(err)
	}
	if !bytes.Equal(data, []byte("\x89PNG\r\n\x1a\n")) {
		t.Fatalf("stored bytes = %q; want original bytes", data)
	}
}
