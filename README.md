# EmotionSense - Facial Emotion Probability Detection

EmotionSense is a real-time facial emotion recognition web application that detects facial expressions and predicts emotion probabilities using deep learning.

## Features

✅ Real-time face detection using webcam

✅ Emotion probability prediction

✅ Multiple emotion classification

✅ Live probability bars

✅ Fast inference

## Supported Emotions

- Happy 😊
- Sad 😢
- Angry 😠
- Fear 😨
- Surprise 😲
- Neutral 😐
- Disgust 🤢

## Tech Stack

Frontend:
- HTML
- CSS
- JavaScript

Backend:
- Python
- Flask

AI / ML:
- OpenCV
- DeepFace / TensorFlow
- NumPy

## Project Structure

```
EmotionSense/
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── backend/
│   ├── app.py
│   ├── model/
│   └── requirements.txt
│
├── assets/
│
└── README.md
```

## Installation

Clone repository:

```bash
git clone <repo-url>
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run project:

```bash
python app.py
```

Open browser:

```bash
http://localhost:5000
```

## How It Works

1. User opens webcam
2. Face detection identifies face region
3. Face preprocessing performed
4. Model predicts emotion probabilities
5. Results displayed in real time

Example Output:

```

Happy : 78.3%
Sad : 5.1%
Neutral : 10.2%
Surprise : 4.4%

```

## Future Improvements

- Voice emotion analysis
- Stress detection
- Multi-face detection
- Better accuracy optimization

## License

MIT License
