from fastapi import Depends, HTTPException
from app.security.oauth2 import oauth2_scheme
from app.utils.jwt import verify_access_token

def get_current_user(
    token: str = Depends(oauth2_scheme)
):
    payload = verify_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid Token"
        )

    return payload