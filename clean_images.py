from PIL import Image
import os

folders = ["train", "test"]

for folder in folders:
    for root, dirs, files in os.walk(folder):
        for file in files:
            path = os.path.join(root, file)
            try:
                img = Image.open(path)
                img.verify()
            except:
                print("Deleting corrupted image:", path)
                os.remove(path)
