import pytest
from app.auth.utils import hash_password, verify_password

def test_password_hashing():
    password = "demo1234"
    hashed = hash_password(password)
    assert hashed != password
    assert verify_password(password, hashed)

def test_wrong_password():
    password = "demo1234"
    hashed = hash_password(password)
    assert not verify_password("wrongpassword", hashed)

def test_password_hash_unique():
    password = "demo1234"
    hash1 = hash_password(password)
    hash2 = hash_password(password)
    assert hash1 != hash2  # bcrypt generates different hashes
