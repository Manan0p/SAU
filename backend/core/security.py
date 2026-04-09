import bcrypt
import os
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from config.settings import get_settings

settings = get_settings()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt(12)).decode()


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


def _get_key() -> bytes:
    key = settings.encryption_key.encode()
    return key[:32].ljust(32, b'\0')


def encrypt_field(plaintext: str) -> str:
    aesgcm = AESGCM(_get_key())
    nonce = os.urandom(12)
    ct = aesgcm.encrypt(nonce, plaintext.encode(), None)
    return base64.b64encode(nonce + ct).decode()


def decrypt_field(ciphertext: str) -> str:
    try:
        data = base64.b64decode(ciphertext)
        aesgcm = AESGCM(_get_key())
        return aesgcm.decrypt(data[:12], data[12:], None).decode()
    except Exception:
        return ciphertext
