from fastapi import FastAPI

app = FastAPI(title="Ordinis AI API")

@app.get("/")
def read_root():
    return {"message": "Welcome to Ordinis AI API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
