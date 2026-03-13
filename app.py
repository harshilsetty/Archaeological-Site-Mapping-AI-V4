import streamlit as st
import cv2
import torch
import numpy as np
from ultralytics import YOLO
import segmentation_models_pytorch as smp
from PIL import Image

# ------------------------
# Page Config
# ------------------------

st.set_page_config(
    page_title="Archaeological Site Mapping AI",
    layout="wide"
)

st.title("Archaeological Site Mapping AI")

# ------------------------
# Load Models
# ------------------------

@st.cache_resource
def load_models():

    yolo_model = YOLO("runs/detect/yolov8s_archaeology2/weights/best.pt")

    seg_model = smp.DeepLabV3Plus(
        encoder_name="resnet34",
        encoder_weights=None,
        in_channels=3,
        classes=6
    )

    seg_model.load_state_dict(
        torch.load("deeplab_model.pth", map_location="cpu")
    )

    seg_model.eval()

    device = "cuda" if torch.cuda.is_available() else "cpu"
    seg_model = seg_model.to(device)

    return yolo_model, seg_model, device


yolo_model, seg_model, device = load_models()

# ------------------------
# Sidebar Controls
# ------------------------

st.sidebar.title("Display Controls")

confidence_threshold = st.sidebar.slider(
    "Detection Confidence",
    0.1, 0.9, 0.25
)

show_vegetation = st.sidebar.checkbox("Vegetation", True)
show_ruins = st.sidebar.checkbox("Ruins", True)
show_structures = st.sidebar.checkbox("Structures", True)
show_boulders = st.sidebar.checkbox("Boulders", True)
show_others = st.sidebar.checkbox("Others", True)

CLASS_VISIBILITY = {
    "vegetation": show_vegetation,
    "ruins": show_ruins,
    "structures": show_structures,
    "boulders": show_boulders,
    "others": show_others
}

# ------------------------
# Color Definitions
# ------------------------

CLASS_COLORS = {
    "boulders": (0,255,255),
    "others": (200,200,200),
    "ruins": (255,0,0),
    "structures": (0,0,255),
    "vegetation": (0,255,0)
}

SEG_COLORS = {
    0:[0,0,0],        # background
    1:[0,255,255],    # boulders
    2:[200,200,200],  # others
    3:[255,0,0],      # ruins
    4:[0,0,255],      # structures
    5:[0,255,0]       # vegetation
}

CLASS_ID_TO_NAME = {
    1:"boulders",
    2:"others",
    3:"ruins",
    4:"structures",
    5:"vegetation"
}

# ------------------------
# Upload Image
# ------------------------

uploaded_file = st.file_uploader(
    "Upload satellite image",
    type=["jpg","jpeg","png"]
)

if uploaded_file:

    image = np.array(Image.open(uploaded_file))

    # ------------------------
    # YOLO Detection
    # ------------------------

    detection_img = image.copy()

    results = yolo_model.predict(
        image,
        conf=confidence_threshold
    )

    for box in results[0].boxes:

        x1,y1,x2,y2 = map(int,box.xyxy[0])
        cls = int(box.cls[0])
        conf = float(box.conf[0])

        label = yolo_model.names[cls]

        if not CLASS_VISIBILITY.get(label,True):
            continue

        color = CLASS_COLORS.get(label,(255,255,255))

        cv2.rectangle(
            detection_img,
            (x1,y1),
            (x2,y2),
            color,
            2
        )

        cv2.putText(
            detection_img,
            f"{label} {conf:.2f}",
            (x1,y1-10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            color,
            2
        )

    # ------------------------
    # Segmentation
    # ------------------------

    img = cv2.resize(image,(512,512))

    img_tensor = torch.tensor(
        img.transpose(2,0,1)/255.0,
        dtype=torch.float32
    ).unsqueeze(0).to(device)

    with torch.no_grad():

        pred = seg_model(img_tensor)

        mask = torch.argmax(pred,dim=1).squeeze().cpu().numpy()

    mask = cv2.resize(
        mask.astype(np.uint8),
        (image.shape[1],image.shape[0])
    )

    seg_vis = image.copy()

    for class_id,color in SEG_COLORS.items():

        if class_id == 0:
            continue

        class_name = CLASS_ID_TO_NAME[class_id]

        if not CLASS_VISIBILITY.get(class_name,True):
            continue

        seg_vis[mask==class_id] = color

    seg_overlay = cv2.addWeighted(
        image,
        0.85,
        seg_vis,
        0.15,
        0
    )

    # ------------------------
    # Combined Output
    # ------------------------

    combined = seg_overlay.copy()

    for box in results[0].boxes:

        x1,y1,x2,y2 = map(int,box.xyxy[0])
        cls = int(box.cls[0])
        conf = float(box.conf[0])

        label = yolo_model.names[cls]

        if not CLASS_VISIBILITY.get(label,True):
            continue

        color = CLASS_COLORS.get(label,(255,255,255))

        cv2.rectangle(
            combined,
            (x1,y1),
            (x2,y2),
            color,
            2
        )

        cv2.putText(
            combined,
            f"{label} {conf:.2f}",
            (x1,y1-10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            color,
            2
        )

    # ------------------------
    # Display Panels
    # ------------------------

    col1,col2 = st.columns(2)
    col3,col4 = st.columns(2)

    col1.image(image,caption="Original",width="stretch")
    col2.image(detection_img,caption="Detection",width="stretch")
    col3.image(seg_overlay,caption="Segmentation",width="stretch")
    col4.image(combined,caption="Combined Output",width="stretch")