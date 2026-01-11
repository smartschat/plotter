FROM python:3.12-slim

WORKDIR /app

# Copy only static files needed for serving
COPY index.html ./
COPY css/ ./css/
COPY js/ ./js/

EXPOSE 8080

CMD ["python", "-m", "http.server", "8080", "--bind", "0.0.0.0"]
