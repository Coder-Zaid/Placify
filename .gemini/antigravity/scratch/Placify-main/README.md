# Placify Intelligence Platform

An AI-powered batch student analysis and resume screening system using Google Gemini API with a modern React/Vite frontend and FastAPI backend.

## 🚀 Project Structure

```
placify/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI application
│   │   ├── models.py            # Pydantic models
│   │   ├── routes/
│   │   │   └── analyze.py       # Analysis endpoints
│   │   └── services/
│   │       └── gemini_service.py # Google Gemini integration
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── BatchAnalysis.jsx
│   │   │   ├── ResumeAnalyzer.jsx
│   │   │   └── Results.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── style.css
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── .env.example
├── .gitignore
└── README.md
```

## 🔧 Setup Instructions

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   venv\Scripts\activate  # Windows
   source venv/bin/activate  # macOS/Linux
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env and add your GEMINI_API_KEY
   ```

5. **Run FastAPI server:**
   ```bash
   python -m uvicorn app.main:app --reload --port 8000
   ```

Server will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env.local
   # Edit if needed, default should work
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

Frontend will be available at `http://localhost:5173`

## 📋 API Endpoints

### Batch Analysis
- **POST** `/analyze/batch`
  - Request: `{ jd_text: string, csv_data: string }`
  - Response: Analysis results for all students

### Resume Analysis
- **POST** `/analyze/resume`
  - Request: `{ jd_text: string, resume_base64: string }`
  - Response: Resume analysis with score and recommendations

### Health Check
- **GET** `/health`
  - Returns service status

## 🌟 Features

- **Batch Intelligence**: Analyze multiple students against a job description
- **Resume Screening**: Analyze individual resumes with AI-powered insights
- **Tailwind CSS**: Modern, responsive UI
- **Google Gemini Integration**: Advanced AI analysis
- **CSV Export**: Download analysis results as CSV

## 🔑 Configuration

### Google Gemini API Key
Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

### Environment Variables

**Backend (.env):**
```
GEMINI_API_KEY=your_api_key_here
FASTAPI_ENV=development
DEBUG=true
```

**Frontend (.env.local):**
```
VITE_API_URL=http://localhost:8000
VITE_ENABLE_BATCH_ANALYSIS=true
VITE_ENABLE_RESUME_ANALYSIS=true
```

## 🛠️ Development

### Backend
- FastAPI for REST API
- Pydantic for data validation
- Google Generative AI SDK
- Pandas for CSV processing

### Frontend
- React 18
- Vite for fast development
- Tailwind CSS for styling
- Axios for HTTP requests
- Lucide React for icons

## 📦 Build for Production

**Backend:**
```bash
cd backend
pip install -r requirements.txt
# Deploy to cloud platform (Heroku, Railway, etc.)
```

**Frontend:**
```bash
cd frontend
npm run build
# Upload dist/ folder to static hosting (Vercel, Netlify, etc.)
```

## 🔐 Security Notes

- Never commit `.env` files to version control
- API keys are stored locally in the browser
- Use HTTPS in production
- Implement rate limiting on backend

## 📝 License

MIT License - feel free to use for your projects

## 🤝 Support

For issues or questions, please create an issue in the repository.
