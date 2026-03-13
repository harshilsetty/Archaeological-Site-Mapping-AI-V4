import cv2
import torch
import numpy as np
import pandas as pd
import os
import segmentation_models_pytorch as smp

# ----------------------------
# Load DeepLab Segmentation Model
# ----------------------------

model = smp.DeepLabV3Plus(
    encoder_name="resnet34",
    encoder_weights=None,
    in_channels=3,
    classes=6
)

model.load_state_dict(torch.load("../deeplab_model.pth", map_location="cpu"))
model.eval()

device = "cuda" if torch.cuda.is_available() else "cpu"
model = model.to(device)

# ----------------------------
# Image Dataset Path
# ----------------------------

IMAGE_FOLDER = "../dataset/train/images"

data = []

print("Extracting terrain features...\n")

for img_name in os.listdir(IMAGE_FOLDER):

    img_path = os.path.join(IMAGE_FOLDER, img_name)

    image = cv2.imread(img_path)

    if image is None:
        continue

    image = cv2.resize(image,(512,512))

    img_tensor = torch.tensor(
        image.transpose(2,0,1)/255.0,
        dtype=torch.float32
    ).unsqueeze(0).to(device)

    with torch.no_grad():

        pred = model(img_tensor)
        mask = torch.argmax(pred,dim=1).squeeze().cpu().numpy()

    # vegetation class index = 5
    vegetation_pixels = np.sum(mask == 5)
    total_pixels = mask.size

    vegetation_ratio = vegetation_pixels / total_pixels

    # simulate slope
    slope = np.random.uniform(0,45)

    # simulate elevation
    elevation = np.random.uniform(350,450)

    # simple erosion rule
    if slope > 25 and vegetation_ratio < 0.3:
        erosion_risk = 1
    else:
        erosion_risk = 0

    data.append([
        slope,
        vegetation_ratio,
        elevation,
        erosion_risk
    ])

print("Feature extraction complete")

df = pd.DataFrame(
    data,
    columns=[
        "slope",
        "vegetation_ratio",
        "elevation",
        "erosion_risk"
    ]
)

df.to_csv("erosion_dataset.csv", index=False)

print("\nDataset saved as erosion_dataset.csv")