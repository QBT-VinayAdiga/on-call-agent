import pytest
from dotenv import load_dotenv

@pytest.hookimpl(tryfirst=True)
def pytest_configure(config):
    load_dotenv()
