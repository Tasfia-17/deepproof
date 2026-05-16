# DeepProof Detection Agents

Real deepfake detection pipeline using EfficientNet-B4.

## Setup

```bash
pip install -r requirements.txt
```

## Usage

```bash
python detect.py /path/to/image.jpg
```

Returns JSON:
```json
{
  "verdict": 0,
  "confidence": 94.2,
  "scores": {
    "efficientnet": 5.8,
    "frequency": 12.3,
    "noise": 8.1
  },
  "reasoning": "Strong authentic signals detected."
}
```

## Model

- **Architecture**: EfficientNet-B4 (pretrained on ImageNet, fine-tuned on FaceForensics++)
- **Input**: 380×380 RGB
- **Output**: Binary classification (authentic=0, fake=1)

## Integration

The API backend calls this script via child_process when `USE_REAL_MODEL=true`.
