#!/usr/bin/env python3
import sys
import json
from pathlib import Path
from detector import DeepfakeDetector

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No file provided"}))
        sys.exit(1)
    
    file_path = Path(sys.argv[1])
    if not file_path.exists():
        print(json.dumps({"error": "File not found"}))
        sys.exit(1)
    
    detector = DeepfakeDetector()
    result = detector.detect(str(file_path))
    print(json.dumps(result))

if __name__ == "__main__":
    main()
