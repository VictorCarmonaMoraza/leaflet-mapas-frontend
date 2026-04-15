import os
from contextlib import contextmanager
from collections.abc import Generator

import psycopg
from psycopg.rows import dict_row


DEFAULT_DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:5432/leaflet_maps_db"


def get_database_url() -> str:
    return os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL)


@contextmanager
def get_connection() -> Generator[psycopg.Connection, None, None]:
    connection = psycopg.connect(get_database_url(), row_factory=dict_row)
    try:
        yield connection
    finally:
        connection.close()
