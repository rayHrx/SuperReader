from abc import ABC, abstractmethod
from dataclasses import dataclass
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from firebase_admin.auth import verify_id_token

security = HTTPBearer()

@dataclass
class UserInfo:
  user_id:str
  is_premium:bool
class TokenDecoder:
  @abstractmethod
  def __call__(self,
    token: HTTPAuthorizationCredentials= Depends(security)) -> UserInfo:
    pass

class DummyDecoder(TokenDecoder):
  def __call__(self,
    token: HTTPAuthorizationCredentials= Depends(security)) -> UserInfo:
    return UserInfo(user_id='test_user', is_premium=True)