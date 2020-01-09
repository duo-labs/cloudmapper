import os

__version__ = "2.8.2"

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__)))
TEMPLATE_DIR = os.path.join(BASE_DIR, "templates")
REPORT_DIR = os.path.join(os.getcwd(), "cloudmapper-report")