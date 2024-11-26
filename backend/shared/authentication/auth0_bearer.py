import json
import urllib.request as urlrequest

from jose import jwt
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

security = HTTPBearer()


class GetUserName:
  def __init__(
    self, domain:str, audience:str, 
    username_field:str='https://chatads.ai/email'):
    self._domain = domain
    self._audience = audience
    self._username_field = username_field
  
  def __call__(self,
    credentials: HTTPAuthorizationCredentials= Depends(security)):
    def match_key(k_id, keys):
      for key in keys:
        if key['kid'] == k_id:
          return {
            'kty': key['kty'], 'kid': key['kid'],
            'use': key['use'], 'n': key['n'],
            'e': key['e']}

    token = credentials.credentials
    k_id = jwt.get_unverified_header(token)['kid']

    jsonurl = urlrequest.urlopen(f'https://{self._domain}/.well-known/jwks.json')
    pub_keys = json.loads(jsonurl.read())['keys']
    pub_key = match_key(k_id, pub_keys)
    if pub_key is None:
      raise Exception('Public key id not found on a the key list')

    try:
      token = jwt.decode(
        token, pub_key, algorithms=['RS256'], audience=self._audience,
        issuer=f"https://{self._domain}/")
    except jwt.ExpiredSignatureError:
      raise Exception({"error":"token_expired",
                      "message":"token is expired"})
    except jwt.JWTClaimsError:
      raise Exception({"error":"invalid_claims",
                      "message":"incorrect claims, please check the audience and issuer"})
    except Exception:
      raise Exception({"error":"invalid_header",
                      "message":"Unable to parse authentication token."})

    if self._username_field not in token:
      raise Exception(f"Token must include a '{self._username_field}' field")
    
    return token[self._username_field]
