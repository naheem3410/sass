import random
import hashlib


def generate_otp() -> str:
    return str(random.randint(100000, 999999))


def hash_otp(otp: str) -> str:
    return hashlib.sha256(otp.encode()).hexdigest()


def verify_otp(otp: str, stored_hash: str) -> bool:
    return hash_otp(otp) == stored_hash
