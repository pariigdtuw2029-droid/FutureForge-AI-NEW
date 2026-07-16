"""
Standardized API response envelope, per the project-wide convention:

    {
        "success": true,
        "data": {},
        "message": ""
    }

Use `success_response(...)` for 2xx returns from new/refactored routes.
Existing legacy routes are left with their original response shapes to
avoid breaking any frontend code already depending on them; migrate them
opportunistically using the same helper.
"""

from typing import Any


def success_response(data: Any = None, message: str = "OK") -> dict:
    return {
        "success": True,
        "data": data,
        "message": message,
    }


def error_response(message: str, data: Any = None) -> dict:
    return {
        "success": False,
        "data": data,
        "message": message,
    }
