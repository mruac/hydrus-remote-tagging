FROM python:alpine
WORKDIR /usr/src/app
RUN pip install --no-cache-dir flask flask_session hydrus-api gunicorn
COPY . .
ENV FLASK_APP server.py
CMD SCRIPT_NAME=${HRT_URL_PREFIX} gunicorn --log-level=DEBUG -b :8243 server:app
