FROM python:3.12.5-slim-bullseye AS builder

WORKDIR /app

COPY Pipfile* .
COPY run.py .
RUN pip install -U pip && \
    pip install pipenv==2024.0.1 && \
    pipenv sync --system && \
    pip uninstall --yes pipenv

FROM python:3.12.5-slim-bullseye AS production

WORKDIR /app

COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages/
COPY --from=builder /usr/local/bin/streamlit /usr/local/bin/streamlit
COPY --from=builder /app /app/

CMD ["streamlit", "run", "run.py"]
