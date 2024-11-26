import requests

from datetime import datetime
from fastapi import Depends, HTTPException, status, Request, Header
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from firebase_admin import credentials, initialize_app
from firebase_admin.auth import verify_id_token
from typing import Annotated, Union

from shared.authentication.base import TokenDecoder, UserInfo


security = HTTPBearer()


class RevenueCatSubscriptionCache:
  def __init__(self, api_key:str):
    self._api_key = api_key
    self._cache = {}


  def check_subscription(self, id:str):

    if id in self._cache and datetime.now() <= self._cache[id]:
      return True
    else:
      url = f"https://api.revenuecat.com/v1/{id}"
      headers = {
          "Content-Type": "application/json",
          "Authorization": f"Bearer {self._api_key}"
      }
      response = requests.get(url, headers=headers)
      data = response.json()

      if 'entitlements' not in data or not data['entitlements']:
        return False
      
      subscription_expiration = datetime.strptime(data['entitlements'])
      if subscription_expiration < datetime.now():
        return False
      
      self._cache[id] = subscription_expiration

    return True

class FirestoreTokenDecoder(TokenDecoder):
  def __init__(self, subscription_cache: RevenueCatSubscriptionCache):
    self._subscription_cache =subscription_cache 
  
  def __call__(self, token: HTTPAuthorizationCredentials = Depends(security), 
               ispro: Annotated[Union[bool, None], Header()] = None) -> UserInfo:    
    try:
      user = verify_id_token(token.credentials)
      user_id = user['uid']
    
      if ispro is not None and not ispro:
        return UserInfo(
        user_id=user_id,
        is_premium=False)

      has_subscription = True # = self._subscription_cache.check_subscription(user_id)

      return UserInfo(
        user_id=user_id,
        is_premium=has_subscription)
    # lots of possible exceptions, see firebase_admin.auth,
    # but most of the time it is a credentials issue
    except Exception as e:
      # we also set the header
      # see https://fastapi.tiangolo.com/tutorial/security/simple-oauth2/
      print(e)
      raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not logged in or Invalid credentials",
        headers={"WWW-Authenticate": "Bearer"},
      )