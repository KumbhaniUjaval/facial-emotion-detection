const imageUploadForm = document.getElementById('image-upload-form');
const fileInput = document.getElementById('image-upload');
const previewContainer = document.getElementById('preview-container');
const uploadedImage = document.getElementById('uploaded-image');
const predictBtn = document.getElementById('predict-btn');
const newImageBtn = document.getElementById('new-image-btn');

window.addEventListener('DOMContentLoaded', () => {
    if (imageUploadForm) {
        const flexContainer = document.querySelector('.flex-container');
        if (flexContainer) {
            flexContainer.classList.add('initial-center');
        }
        const rightPanel = document.querySelector('.right-panel');
        if (rightPanel) {
            rightPanel.classList.add('hidden');
        }
    }
});

function createImageOverlay() {
    const container = document.getElementById('preview-container');
    if (!container) return;
    let overlay = document.getElementById('image-face-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'image-face-overlay';
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.pointerEvents = 'none';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        container.style.position = 'relative';
        container.appendChild(overlay);
    }
    return overlay;
}

if (imageUploadForm) {
    imageUploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        try {
            const response = await fetch('/predict_image', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            const flexContainer = document.querySelector('.flex-container');
            if (flexContainer) {
                flexContainer.classList.remove('initial-center');
            }
            const rightPanel = document.querySelector('.right-panel');
            if (rightPanel) {
                rightPanel.classList.remove('hidden');
            }
            const file = fileInput.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    uploadedImage.src = e.target.result;
                    previewContainer.classList.remove('hidden');
                    uploadedImage.onload = function () {
                        displayImageResult(result);
                    };
                };
                reader.readAsDataURL(file);
            }
            fileInput.classList.add('hidden');
            predictBtn.classList.add('hidden');
            newImageBtn.classList.remove('hidden');
        } catch (error) {
            console.error('Error:', error);
        }
    });
}

function displayImageResult(result) {
    const resultDiv = document.getElementById('result');
    const facesContainer = document.getElementById('faces-container');
    if (result.error) {
        facesContainer.innerHTML = `<p>Error: ${result.error}</p>`;
        resultDiv.classList.remove('hidden');
        return;
    }
    if (result.faces && result.faces.length > 0) {
        facesContainer.innerHTML = '';
        drawFacesOnImage(result.faces);
        result.faces.forEach((face, index) => {
            const faceDiv = document.createElement('div');
            faceDiv.className = 'face-result';
            faceDiv.innerHTML = `
                <div class="emotion-display">Face ${index + 1}: <span>${face.emotion}</span></div>
                <div>Confidence: <span>${(face.confidence * 100).toFixed(2)}%</span></div>
                <div class="confidence-bar">
                    <div class="confidence-bar-fill" style="width: ${(face.confidence * 100).toFixed(2)}%"></div>
                </div>
            `;
            facesContainer.appendChild(faceDiv);
        });
    } else {
        facesContainer.innerHTML = '<p>No faces detected</p>';
    }
    resultDiv.classList.remove('hidden');
}

// For imageDisplay.js - Fixed version of drawFacesOnImage
function drawFacesOnImage(faces) {
    createImageOverlay();
    const overlay = document.getElementById('image-face-overlay');
    if (!overlay) return;
    overlay.innerHTML = '';
    const img = document.getElementById('uploaded-image');
    const imgRect = img.getBoundingClientRect();
    const containerRect = previewContainer.getBoundingClientRect();
    const offsetX = (containerRect.width - imgRect.width) / 2;
    const offsetY = (containerRect.height - imgRect.height) / 2;
    const scaleX = imgRect.width / img.naturalWidth;
    const scaleY = imgRect.height / img.naturalHeight;
    
    faces.forEach((face, index) => {
        const [x, y, w, h] = face.bbox;
        const scaledX = x * scaleX + offsetX;
        const scaledY = y * scaleY + offsetY;
        const scaledW = w * scaleX;
        const scaledH = h * scaleY;
        
        // Create face rectangle
        const faceRect = document.createElement('div');
        faceRect.className = 'face-rect';
        faceRect.style.position = 'absolute';
        faceRect.style.left = `${scaledX}px`;
        faceRect.style.top = `${scaledY}px`;
        faceRect.style.width = `${scaledW}px`;
        faceRect.style.height = `${scaledH}px`;
        faceRect.style.border = '2px solid #4a90e2';
        faceRect.style.boxSizing = 'border-box';
        overlay.appendChild(faceRect);
        
        // Create emotion label
        const emotionLabel = document.createElement('div');
        emotionLabel.className = 'emotion-label';
        emotionLabel.textContent = face.emotion;
        emotionLabel.style.position = 'absolute';
        emotionLabel.style.top = `${scaledY - 20}px`;
        emotionLabel.style.left = `${scaledX}px`;
        emotionLabel.style.backgroundColor = '#4a90e2';
        emotionLabel.style.color = 'white';
        emotionLabel.style.padding = '2px 5px';
        emotionLabel.style.fontSize = '12px';
        emotionLabel.style.borderRadius = '3px';
        overlay.appendChild(emotionLabel);
        
        // Create face number
        const faceNumber = document.createElement('div');
        faceNumber.className = 'face-number';
        faceNumber.textContent = (index + 1).toString();
        faceNumber.style.position = 'absolute';
        faceNumber.style.top = `${scaledY + 5}px`;
        faceNumber.style.left = `${scaledX + 5}px`;
        faceNumber.style.backgroundColor = '#4a90e2';
        faceNumber.style.color = 'white';
        faceNumber.style.padding = '2px 6px';
        faceNumber.style.fontSize = '12px';
        faceNumber.style.borderRadius = '50%';
        faceNumber.style.fontWeight = 'bold';
        overlay.appendChild(faceNumber);
    });
}

if (newImageBtn) {
    newImageBtn.addEventListener('click', () => {
        fileInput.value = '';
        fileInput.classList.remove('hidden');
        predictBtn.classList.remove('hidden');
        document.getElementById('result').classList.add('hidden');
        previewContainer.classList.add('hidden');
        const overlay = document.getElementById('image-face-overlay');
        if (overlay) {
            overlay.innerHTML = '';
        }
        newImageBtn.classList.add('hidden');
        const flexContainer = document.querySelector('.flex-container');
        if (flexContainer) {
            flexContainer.classList.add('initial-center');
        }
        const rightPanel = document.querySelector('.right-panel');
        if (rightPanel) {
            rightPanel.classList.add('hidden');
        }
    });
}

window.addEventListener('resize', function () {
    const result = document.getElementById('result');
    const preview = document.getElementById('preview-container');
    if (!result.classList.contains('hidden') && 
        !preview.classList.contains('hidden') && 
        result.innerHTML.includes('Face')) {
        const faceResults = document.querySelectorAll('.face-result');
        if (faceResults.length === 0) return;
        const faces = [];
        faceResults.forEach((faceResult, index) => {
            const emotionEl = faceResult.querySelector('.emotion-display span');
            const emotion = emotionEl ? emotionEl.textContent : 'Unknown';
            const confidenceEl = faceResult.querySelector('.confidence-bar-fill');
            const confidence = confidenceEl ? 
                parseFloat(confidenceEl.style.width) / 100 : 0;
            faces.push({
                emotion: emotion,
                confidence: confidence,
                bbox: [10 + index * 20, 10 + index * 20, 100, 100]
            });
        });
        drawFacesOnImage(faces);
    }
});