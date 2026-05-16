import torch
import torch.nn as nn
from torchvision import transforms
from efficientnet_pytorch import EfficientNet
from PIL import Image
import cv2
import numpy as np
from pathlib import Path

class DeepfakeDetector:
    def __init__(self, model_path=None):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = EfficientNet.from_pretrained('efficientnet-b4', num_classes=2)
        
        if model_path and Path(model_path).exists():
            self.model.load_state_dict(torch.load(model_path, map_location=self.device))
        
        self.model.to(self.device)
        self.model.eval()
        
        self.transform = transforms.Compose([
            transforms.Resize((380, 380)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])
    
    def detect(self, file_path):
        ext = Path(file_path).suffix.lower()
        
        if ext in ['.jpg', '.jpeg', '.png', '.webp']:
            return self._detect_image(file_path)
        elif ext in ['.mp4', '.webm', '.mov']:
            return self._detect_video(file_path)
        else:
            return {"error": "Unsupported file type"}
    
    def _detect_image(self, path):
        img = Image.open(path).convert('RGB')
        tensor = self.transform(img).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            output = self.model(tensor)
            probs = torch.softmax(output, dim=1)[0]
            fake_score = probs[1].item() * 100
        
        return {
            "verdict": 1 if fake_score > 50 else 0,
            "confidence": max(fake_score, 100 - fake_score),
            "scores": {
                "efficientnet": round(fake_score, 2),
                "frequency": round(self._frequency_analysis(path), 2),
                "noise": round(self._noise_analysis(path), 2)
            },
            "reasoning": self._generate_reasoning(fake_score)
        }
    
    def _detect_video(self, path):
        cap = cv2.VideoCapture(path)
        frame_scores = []
        frame_count = 0
        
        while cap.isOpened() and frame_count < 30:
            ret, frame = cap.read()
            if not ret:
                break
            
            if frame_count % 10 == 0:
                img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
                tensor = self.transform(img).unsqueeze(0).to(self.device)
                
                with torch.no_grad():
                    output = self.model(tensor)
                    probs = torch.softmax(output, dim=1)[0]
                    frame_scores.append(probs[1].item() * 100)
            
            frame_count += 1
        
        cap.release()
        
        if not frame_scores:
            return {"error": "Could not process video"}
        
        fake_score = np.mean(frame_scores)
        
        return {
            "verdict": 1 if fake_score > 50 else 0,
            "confidence": max(fake_score, 100 - fake_score),
            "scores": {
                "efficientnet": round(fake_score, 2),
                "temporal": round(np.std(frame_scores) * 10, 2),
                "frames_analyzed": len(frame_scores)
            },
            "reasoning": self._generate_reasoning(fake_score)
        }
    
    def _frequency_analysis(self, path):
        img = cv2.imread(path, cv2.IMREAD_GRAYSCALE)
        f = np.fft.fft2(img)
        fshift = np.fft.fftshift(f)
        magnitude = np.abs(fshift)
        high_freq = np.sum(magnitude[magnitude > np.percentile(magnitude, 95)])
        return min(100, (high_freq / magnitude.size) * 1000)
    
    def _noise_analysis(self, path):
        img = cv2.imread(path, cv2.IMREAD_GRAYSCALE)
        laplacian = cv2.Laplacian(img, cv2.CV_64F)
        variance = laplacian.var()
        return min(100, variance / 10)
    
    def _generate_reasoning(self, score):
        if score < 30:
            return "Strong authentic signals detected. No manipulation artifacts found."
        elif score < 50:
            return "Likely authentic with minor compression artifacts."
        elif score < 70:
            return "Suspicious patterns detected. Possible manipulation."
        else:
            return "High confidence deepfake. Multiple manipulation artifacts detected."
