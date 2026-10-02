from __future__ import annotations

from io import BytesIO
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError


MAX_PROFILE_PHOTO_BYTES = 5 * 1024 * 1024
MAX_PROFILE_PHOTO_DIMENSION = 1024
ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}

UPLOAD_ROOT = Path(__file__).resolve().parents[2] / "uploads"
PROFILE_PHOTO_DIR = UPLOAD_ROOT / "profile_photos"


class LocalProfilePhotoStorage:
    """Development storage provider for profile photos.

    Files live under backend/uploads/profile_photos and are exposed by
    FastAPI at /uploads. The public API only depends on this class's
    save/delete contract so a cloud object-storage implementation can
    replace it later.
    """

    def __init__(self) -> None:
        PROFILE_PHOTO_DIR.mkdir(parents=True, exist_ok=True)

    async def save(self, upload: UploadFile, user_id: str) -> str:
        data = await upload.read(MAX_PROFILE_PHOTO_BYTES + 1)

        if not data:
            raise HTTPException(
                status_code=400,
                detail="Choose an image to upload.",
            )

        if len(data) > MAX_PROFILE_PHOTO_BYTES:
            raise HTTPException(
                status_code=413,
                detail="Profile photos must be 5 MB or smaller.",
            )

        try:
            image = Image.open(BytesIO(data))
            image.load()
        except (UnidentifiedImageError, OSError):
            raise HTTPException(
                status_code=400,
                detail="The selected file is not a valid image.",
            )

        if image.format not in ALLOWED_FORMATS:
            raise HTTPException(
                status_code=400,
                detail="Profile photos must be JPEG, PNG, or WebP.",
            )

        # Normalize orientation/metadata by decoding and re-encoding the image.
        if image.mode not in {"RGB", "RGBA"}:
            image = image.convert("RGBA" if "transparency" in image.info else "RGB")

        image.thumbnail(
            (MAX_PROFILE_PHOTO_DIMENSION, MAX_PROFILE_PHOTO_DIMENSION),
            Image.Resampling.LANCZOS,
        )

        filename = f"{user_id}-{uuid4().hex}.webp"
        destination = PROFILE_PHOTO_DIR / filename

        save_image = image
        if save_image.mode == "RGBA":
            save_image.save(destination, "WEBP", quality=88, method=6)
        else:
            save_image.convert("RGB").save(
                destination,
                "WEBP",
                quality=88,
                method=6,
            )

        return f"/uploads/profile_photos/{filename}"

    def delete(self, photo_url: str | None) -> None:
        if not photo_url:
            return

        prefix = "/uploads/profile_photos/"
        if not photo_url.startswith(prefix):
            # Never delete arbitrary/external paths.
            return

        filename = Path(photo_url).name
        target = PROFILE_PHOTO_DIR / filename

        try:
            target.resolve().relative_to(PROFILE_PHOTO_DIR.resolve())
        except ValueError:
            return

        target.unlink(missing_ok=True)


profile_photo_storage = LocalProfilePhotoStorage()
