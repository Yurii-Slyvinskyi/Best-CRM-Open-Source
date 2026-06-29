from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.authentication import JWTAuthentication
from channels.db import database_sync_to_async
import logging

logger = logging.getLogger(__name__)


class JWTAuthMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        headers = dict(scope["headers"])
        if b"authorization" in headers:
            try:
                token_name, token = headers[b"authorization"].decode().split()
                if token_name.lower() == "bearer":
                    user = await self.get_user_from_token(token)
                    if user:
                        scope["user"] = user
            except Exception as e:
                logger.error(f"Error authenticating user: {e}")
                scope["user"] = AnonymousUser()
        else:
            scope["user"] = AnonymousUser()

        return await self.app(scope, receive, send)

    @database_sync_to_async
    def get_user_from_token(self, token):
        jwt_auth = JWTAuthentication()
        try:
            validated_token = jwt_auth.get_validated_token(token)
            user = jwt_auth.get_user(validated_token)
            return user
        except Exception as e:
            logger.warning(f"Token validation failed: {e}")
            return None
