from flask import Flask, render_template, request, jsonify
import cv2
import numpy as np
import mediapipe as mp
import base64
import tensorflow as tf

app = Flask(__name__)

# Load model
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Dropout

def build_model():
    model = Sequential()

    model.add(Conv2D(32,(3,3),activation='relu',input_shape=(48,48,1)))
    model.add(MaxPooling2D(2,2))

    model.add(Conv2D(64,(3,3),activation='relu'))
    model.add(MaxPooling2D(2,2))

    model.add(Conv2D(128,(3,3),activation='relu'))
    model.add(MaxPooling2D(2,2))

    model.add(Flatten())
    model.add(Dense(128,activation='relu'))
    model.add(Dropout(0.5))
    model.add(Dense(7,activation='softmax'))

    return model

model = build_model()
model.load_weights("emotion_model.h5")

mp_face_detection = mp.solutions.face_detection
face_detection = mp_face_detection.FaceDetection(min_detection_confidence=0.7)


def preprocess_face(face):

    if face is None:
        return None

    if len(face.shape) == 3:
        face = cv2.cvtColor(face, cv2.COLOR_BGR2GRAY)

    face = cv2.resize(face, (48, 48))
    face = face.astype("float32") / 255.0
    face = np.expand_dims(face, axis=0)
    face = np.expand_dims(face, axis=-1)

    return face

@app.route('/')
def index():
    return render_template("index.html")

@app.route('/image_prediction')
def image_prediction():
    return render_template("image_prediction.html")


@app.route("/predict_live", methods=["POST"])
def predict_live():

    data = request.json
    image_data = data["image"].split(",")[1]
    image_bytes = base64.b64decode(image_data)

    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    results = face_detection.process(rgb_img)

    faces_results = []

    if results.detections:

        for detection in results.detections:

            bboxC = detection.location_data.relative_bounding_box
            ih, iw, _ = img.shape

            x = int(bboxC.xmin * iw)
            y = int(bboxC.ymin * ih)
            w = int(bboxC.width * iw)
            h = int(bboxC.height * ih)

            face = img[y:y+h, x:x+w]

            if face.size == 0:
                continue

            processed = preprocess_face(face)

            if processed is not None:

                predictions = model.predict(processed)
                emotion_idx = np.argmax(predictions)

                emotions = [
                    "Angry",
                    "Disgust",
                    "Fear",
                    "Happy",
                    "Sad",
                    "Neutral",
                    "Surprise"
                ]

                faces_results.append({
                    "emotion": emotions[emotion_idx],
                    "bbox": [x, y, w, h]
                })

    return jsonify({"faces": faces_results})


if __name__ == "__main__":
    app.run(debug=True)