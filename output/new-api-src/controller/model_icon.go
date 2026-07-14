package controller

import (
	"bytes"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"

	"github.com/QuantumNous/new-api/common"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const maxModelIconBytes = 2 << 20

var errUnsupportedModelIcon = errors.New("unsupported model icon format")

func inspectModelIcon(data []byte) (string, error) {
	if len(data) == 0 || len(data) > maxModelIconBytes {
		return "", fmt.Errorf("model icon must be between 1 byte and %d MiB", maxModelIconBytes/(1<<20))
	}

	contentType := http.DetectContentType(data)
	// DetectContentType needs a larger WebP sample than the RIFF signature
	// alone, so explicitly validate the container marker as well.
	if len(data) >= 12 && bytes.Equal(data[:4], []byte("RIFF")) && bytes.Equal(data[8:12], []byte("WEBP")) {
		contentType = "image/webp"
	}
	switch contentType {
	case "image/png":
		return ".png", nil
	case "image/jpeg":
		return ".jpg", nil
	case "image/webp":
		return ".webp", nil
	default:
		return "", errUnsupportedModelIcon
	}
}

func modelIconStorageDir() string {
	if configured := os.Getenv("MODEL_ICON_DIR"); configured != "" {
		return configured
	}
	return "/data/model-icons"
}

// UploadModelIcon stores a validated administrator-provided model icon in the
// persistent data volume and returns a site-relative URL for the model record.
func UploadModelIcon(c *gin.Context) {
	fileHeader, err := c.FormFile("file")
	if err != nil {
		common.ApiErrorMsg(c, "请选择模型图标文件")
		return
	}
	if fileHeader.Size > maxModelIconBytes {
		common.ApiErrorMsg(c, "模型图标不能超过 2 MiB")
		return
	}

	file, err := fileHeader.Open()
	if err != nil {
		common.ApiError(c, err)
		return
	}
	defer file.Close()

	data, err := io.ReadAll(io.LimitReader(file, maxModelIconBytes+1))
	if err != nil {
		common.ApiError(c, err)
		return
	}
	ext, err := inspectModelIcon(data)
	if err != nil {
		common.ApiErrorMsg(c, "仅支持 PNG、JPG 或 WEBP 图片，且文件不超过 2 MiB")
		return
	}

	dir := modelIconStorageDir()
	if err := os.MkdirAll(dir, 0755); err != nil {
		common.ApiError(c, err)
		return
	}
	name := uuid.NewString() + ext
	path := filepath.Join(dir, name)
	if err := os.WriteFile(path, data, 0644); err != nil {
		common.ApiError(c, err)
		return
	}

	common.ApiSuccess(c, gin.H{"url": "/model-icons/" + name})
}
