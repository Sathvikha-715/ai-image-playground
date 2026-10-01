from fastapi import FastAPI

app = FastAPI(title="AI Image Playground API")

@app.get("/")
def root():
    return {"message": "API is running"}

@app.get("/health")
def health():
    return {"status": "ok"}