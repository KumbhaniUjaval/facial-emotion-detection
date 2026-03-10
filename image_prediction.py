import tensorflow as tf
import numpy as np
from tensorflow.keras.preprocessing.image import img_to_array # type: ignore
from tkinter import Tk, filedialog
from PIL import Image

model = tf.keras.models.load_model('emotion_model.h5')

sentiment_labels = {
    0: 'Angry',
    1: 'Disgust',
    2: 'Fear',
    3: 'Happy',
    4: 'Sad',
    5: 'Surprise',
    6: 'Neutral'
}

def preprocess_image(image_path):
    try:
        img = Image.open(image_path).convert('L')
        img = img.resize((48, 48))
        img_array = img_to_array(img)
        img_array = img_array.astype('float32') / 255
        img_array = np.expand_dims(img_array, axis=0)
        print(f'Preprocessed image shape: {img_array.shape}')
        print(f'Preprocessed image stats: min={img_array.min()}, max={img_array.max()}')
        return img_array
    except Exception as e:
        print(f"Error processing image {image_path}: {e}")
        return None

def predict_sentiment(image_path):
    img_array = preprocess_image(image_path)
    if img_array is not None:
        prediction = model.predict(img_array)
        print(f'Raw prediction: {prediction}')
        sentiment_index = np.argmax(prediction)
        return sentiment_index
    return None

def main():
    root = Tk()
    root.withdraw()

    file_paths = filedialog.askopenfilenames(
        title="Select Images",
        filetypes=[("Image Files", "*.png;*.jpg;*.jpeg")]
    )

    if file_paths:
        for file_path in file_paths:
            sentiment_index = predict_sentiment(file_path)
            if sentiment_index is not None:
                sentiment_label = sentiment_labels.get(sentiment_index, 'Unknown')
                print(f'Image: {file_path}')
                print(f'Predicted sentiment: {sentiment_label}')
                print('-' * 30)
            else:
                print(f'Failed to process image: {file_path}')

if __name__ == "__main__":
    main()