FROM python:3.12.5-slim-bookworm

WORKDIR /app
RUN pip install pipenv

COPY Pipfile* .
COPY run.py .
RUN pipenv install

CMD ["pipenv", "run", "streamlit", "run", "run.py"]
