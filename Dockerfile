FROM python:alpine
WORKDIR /usr/src/app
RUN pip install --no-cache-dir flask flask_session hydrus-api
COPY . .
CMD ["python","./server.py"]
