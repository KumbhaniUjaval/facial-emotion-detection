import cv2
import numpy as np
import tensorflow as tf
import mediapipe as mp
from tensorflow.keras.models import load_model # type: ignore

model = load_model('emotion_model.h5', compile=False, safe_mode=False)
mp_face_detection = mp.solutions.face_detection
mp_drawing = mp.solutions.drawing_utils
face_detection = mp_face_detection.FaceDetection(min_detection_confidence=0.7)

def preprocess_face(face):
    if face is None:
        print("No face detected")
        return None
    
    if len(face.shape) == 3 and face.shape[2] == 3:
        face = cv2.cvtColor(face, cv2.COLOR_BGR2GRAY)
    elif len(face.shape) == 2:
        pass
    else:
        print("Unexpected number of channels in the face image.")
        return None
    
    face = cv2.resize(face, (48, 48))
    face = face.astype('float32') / 255.0
    face = np.expand_dims(face, axis=0)
    face = np.expand_dims(face, axis=-1)
    return face

cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("Error: Could not open video stream.")
    exit()

while True:
    ret, frame = cap.read()
    
    if not ret:
        print("Failed to capture image")
        break
    
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = face_detection.process(rgb_frame)
    
    if results.detections:
        for detection in results.detections:
            bboxC = detection.location_data.relative_bounding_box
            ih, iw, _ = frame.shape
            x, y, w, h = int(bboxC.xmin * iw), int(bboxC.ymin * ih), int(bboxC.width * iw), int(bboxC.height * ih)
            face = frame[y:y+h, x:x+w]
            preprocessed_face = preprocess_face(face)
            
            if preprocessed_face is not None:
                predictions = model.predict(preprocessed_face)
                emotion = np.argmax(predictions)
                emotion_labels = ['Angry', 'Disgust', 'Fear', 'Happy', 'Sad', 'Neutral', 'Surprise']
                emotion_text = emotion_labels[emotion]
                
                cv2.rectangle(frame, (x, y), (x+w, y+h), (255, 0, 0), 2)
                cv2.putText(frame, emotion_text, (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
    
    cv2.imshow('Emotion Detection with MediaPipe', frame)
    
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()