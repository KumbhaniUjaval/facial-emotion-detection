const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
let stream;
let intervalId;
let lastPrediction = "";

if (canvas) {
    canvas.width = 400;
    canvas.height = 300;
}

if (video) {
    video.width = 400;
    video.height = 300;
}

if (startBtn) {
    const newStartBtn = startBtn.cloneNode(true);
    startBtn.parentNode.replaceChild(newStartBtn, startBtn);
    newStartBtn.addEventListener('click', startPrediction);
}

if (stopBtn) {
    const newStopBtn = stopBtn.cloneNode(true);
    stopBtn.parentNode.replaceChild(newStopBtn, stopBtn);
    newStopBtn.addEventListener('click', stopPrediction);
}

document.addEventListener('DOMContentLoaded', function() {
    const flexContainer = document.querySelector('.flex-container');
    if (flexContainer) {
        flexContainer.style.display = 'none';
    }
});

async function startPrediction() {
    try {
        if (video) {
            video.style.display = 'block';
        }

        const flexContainer = document.querySelector('.flex-container');
        if (flexContainer) {
            flexContainer.style.display = 'flex';
            flexContainer.style.justifyContent = 'space-between';
        }

        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 400 },
                height: { ideal: 300 }
            } 
        });

        video.srcObject = stream;

        video.onloadedmetadata = function() {
            video.play().then(() => {
                if (startBtn) document.getElementById('start-btn').classList.add('hidden');
                if (stopBtn) document.getElementById('stop-btn').classList.remove('hidden');

                const resultDiv = document.getElementById('result');
                if (resultDiv) resultDiv.classList.remove('hidden');

                createFaceOverlay();

                intervalId = setInterval(predictLive, 1000);
            }).catch(err => {
            });
        };

    } catch (err) {
        alert("Error accessing the camera: " + err.message);
    }
}

function createFaceOverlay() {
    const videoContainer = document.getElementById('video-container');
    
    let overlay = document.getElementById('face-overlay');
    if (!overlay) {
        overlay = document.createElement('canvas');
        overlay.id = 'face-overlay';
        overlay.width = video.width;
        overlay.height = video.height;
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.pointerEvents = 'none';
        videoContainer.style.position = 'relative';
        videoContainer.appendChild(overlay);
    }
}

function stopPrediction() {
    clearInterval(intervalId);
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    video.srcObject = null;

    if (video) {
        video.style.display = 'none';
    }

    const flexContainer = document.querySelector('.flex-container');
    if (flexContainer) {
        flexContainer.style.display = 'none';
    }

    if (startBtn) document.getElementById('start-btn').classList.remove('hidden');
    if (stopBtn) document.getElementById('stop-btn').classList.add('hidden');

    const resultDiv = document.getElementById('result');
    if (resultDiv) resultDiv.classList.add('hidden');

    const overlay = document.getElementById('face-overlay');
    if (overlay) {
        const ctx = overlay.getContext('2d');
        ctx.clearRect(0, 0, overlay.width, overlay.height);
    }
}

async function predictLive() {
    if (!video.srcObject) {
        return;
    }

    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL('image/jpeg');

    try {
        const response = await fetch('/predict_live', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image: imageData }),
        });
        const result = await response.json();
        displayLiveResult(result);
    } catch (error) {
    }
}

function displayLiveResult(result) {
    const resultDiv = document.getElementById('result');
    if (!resultDiv) {
        return;
    }

    if (result.error) {
        resultDiv.innerHTML = `<p>Error: ${result.error}</p>`;
        return;
    }

    if (result.faces && result.faces.length > 0) {
        const currentPrediction = result.faces[0].emotion;
        
        if (currentPrediction !== lastPrediction) {
            resultDiv.innerHTML = '<h2>Prediction Results:</h2>';
            
            drawFacesOnOverlay(result.faces);

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
                resultDiv.appendChild(faceDiv);
            });

            lastPrediction = currentPrediction;
        } else {
            const confidenceSpan = resultDiv.querySelector('.face-result .confidence-bar-fill');
            if (confidenceSpan) {
                confidenceSpan.style.width = `${(result.faces[0].confidence * 100).toFixed(2)}%`;
            }
        }
    } else {
        resultDiv.innerHTML = '<h2>Prediction Results:</h2><p>No faces detected</p>';
        const overlay = document.getElementById('face-overlay');
        if (overlay) {
            const ctx = overlay.getContext('2d');
            ctx.clearRect(0, 0, overlay.width, overlay.height);
        }
    }

    resultDiv.classList.remove('hidden');
}

function drawFacesOnOverlay(faces) {
    const overlay = document.getElementById('face-overlay');
    if (!overlay) return;

    const ctx = overlay.getContext('2d');
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    faces.forEach((face, index) => {
        let [x, y, w, h] = face.bbox;
        
        const horizontalOffset = w * 0.6;
        const widthIncrease = w * 0.4;
        const heightIncrease = h * 0.2;
        
        x = Math.max(0, x + horizontalOffset - widthIncrease / 2);
        y = Math.max(0, y - heightIncrease / 2);
        
        w = Math.min(overlay.width - x, w + widthIncrease);
        h = Math.min(overlay.height - y, h + heightIncrease);
        
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#4a90e2';
        ctx.strokeRect(x, y, w, h);

        ctx.font = '12px Arial';
        ctx.fillStyle = '#4a90e2';
        ctx.fillRect(x, y - 20, face.emotion.length * 7 + 10, 20);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(face.emotion, x + 5, y - 5);
        
        const circleRadius = 10;
        const circleX = x + 15;
        const circleY = y + 15;
        
        ctx.beginPath();
        ctx.arc(circleX, circleY, circleRadius, 0, 2 * Math.PI);
        ctx.fillStyle = '#4a90e2';
        ctx.fill();
        
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText((index + 1).toString(), circleX, circleY);
        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic';
    });
}