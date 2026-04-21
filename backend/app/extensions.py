"""Shared Flask extensions (initialised without app here)."""
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt

jwt    = JWTManager()
bcrypt = Bcrypt()
