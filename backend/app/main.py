from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from .config import settings
from .database import get_db
from .models import (
    CatalogItem,
    CollectionEntry,
    Rating,
    Review,
    User,
    UserProfile,
)
from .schemas import (
    EntryIn,
    EntryOut,
    EntryPatch,
    LoginIn,
    ProfilePatch,
    PublicEntryOut,
    RatingIn,
    RatingOut,
    RegisterIn,
    ReviewIn,
    ReviewOut,
    TokenOut,
    UserOut,
)
from .security import current_user, hasher, make_token


app = FastAPI(
    title="MyBookNook API",
    version="0.2.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# Health
# ---------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok"}


# ---------------------------------------------------------
# Authentication
# ---------------------------------------------------------

@app.post(
    "/auth/register",
    response_model=UserOut,
    status_code=201,
)
def register(
    data: RegisterIn,
    db: Session = Depends(get_db),
):
    username = data.username.strip()
    email = data.email.lower()

    user = User(
        username=username,
        email=email,
        password_hash=hasher.hash(data.password),
    )

    user.profile = UserProfile(
        display_name=username,
        bio="",
        profile_visibility="public",
        books_visibility="private",
        vinyl_visibility="private",
    )

    db.add(user)

    try:
        db.commit()

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail="Username or email already in use",
        )

    db.refresh(user)

    return user


@app.post(
    "/auth/login",
    response_model=TokenOut,
)
def login(
    data: LoginIn,
    db: Session = Depends(get_db),
):
    user = db.scalar(
        select(User).where(
            User.email == data.email.lower()
        )
    )

    if not user or not hasher.verify(
        data.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    return TokenOut(
        access_token=make_token(user.id)
    )


# ---------------------------------------------------------
# Current user / profile
# ---------------------------------------------------------

@app.get(
    "/users/me",
    response_model=UserOut,
)
def me(
    user: User = Depends(current_user),
):
    return user


@app.patch(
    "/users/me/profile",
    response_model=UserOut,
)
def update_profile(
    data: ProfilePatch,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    if user.profile is None:
        user.profile = UserProfile(
            display_name=user.username,
            bio="",
            profile_visibility="public",
            books_visibility="private",
            vinyl_visibility="private",
        )

    updates = data.model_dump(
        exclude_unset=True,
    )

    for key, value in updates.items():
        setattr(user.profile, key, value)

    db.commit()
    db.refresh(user)

    return user


# ---------------------------------------------------------
# Collection
# ---------------------------------------------------------

@app.get(
    "/collection",
    response_model=list[EntryOut],
)
def my_collection(
    kind: str | None = None,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    query = (
        select(CollectionEntry)
        .options(joinedload(CollectionEntry.item))
        .where(
            CollectionEntry.user_id == user.id
        )
        .order_by(
            CollectionEntry.added_at.desc()
        )
    )

    if kind:
        query = (
            query
            .join(CatalogItem)
            .where(
                CatalogItem.kind == kind
            )
        )

    return db.scalars(query).all()


@app.post(
    "/collection",
    response_model=EntryOut,
    status_code=201,
)
def add_to_collection(
    data: EntryIn,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    item = None

    if data.item.identifier:
        item = db.scalar(
            select(CatalogItem).where(
                CatalogItem.kind == data.item.kind,
                CatalogItem.identifier == data.item.identifier,
            )
        )

    if item is None:
        item = CatalogItem(
            **data.item.model_dump()
        )

        db.add(item)
        db.flush()

    entry = CollectionEntry(
        user_id=user.id,
        item_id=item.id,
        status=data.status,
        visibility=data.visibility,
        reading_status=data.reading_status,
        personal_notes=data.personal_notes,
        acquired_at=data.acquired_at,
    )

    db.add(entry)
    db.commit()

    db.refresh(entry)

    return entry


@app.patch(
    "/collection/{entry_id}",
    response_model=EntryOut,
)
def update_entry(
    entry_id: str,
    data: EntryPatch,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    entry = db.scalar(
        select(CollectionEntry)
        .options(
            joinedload(CollectionEntry.item)
        )
        .where(
            CollectionEntry.id == entry_id,
            CollectionEntry.user_id == user.id,
        )
    )

    if not entry:
        raise HTTPException(
            status_code=404,
            detail="Collection entry not found",
        )

    updates = data.model_dump(
        exclude_unset=True
    )

    # These database columns are NOT NULL.
    # Explicit null values should not be allowed to overwrite them.
    if "status" in updates and updates["status"] is None:
        raise HTTPException(
            status_code=422,
            detail="Status cannot be null",
        )

    if "visibility" in updates and updates["visibility"] is None:
        raise HTTPException(
            status_code=422,
            detail="Visibility cannot be null",
        )

    if (
        "personal_notes" in updates
        and updates["personal_notes"] is None
    ):
        raise HTTPException(
            status_code=422,
            detail="Personal notes cannot be null",
        )

    for key, value in updates.items():
        setattr(entry, key, value)

    db.commit()
    db.refresh(entry)

    return entry


@app.delete(
    "/collection/{entry_id}",
    status_code=204,
)
def delete_entry(
    entry_id: str,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    entry = db.scalar(
        select(CollectionEntry).where(
            CollectionEntry.id == entry_id,
            CollectionEntry.user_id == user.id,
        )
    )

    if not entry:
        raise HTTPException(
            status_code=404,
            detail="Collection entry not found",
        )

    db.delete(entry)
    db.commit()


# ---------------------------------------------------------
# Ratings
# ---------------------------------------------------------

def rating_response(
    rating: Rating,
) -> RatingOut:
    return RatingOut(
        id=rating.id,
        user_id=rating.user_id,
        item_id=rating.item_id,
        stars=rating.value / 2.0,
        created_at=rating.created_at,
        updated_at=rating.updated_at,
    )


@app.get(
    "/catalog/{item_id}/rating",
    response_model=RatingOut,
)
def get_my_rating(
    item_id: str,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    rating = db.scalar(
        select(Rating).where(
            Rating.user_id == user.id,
            Rating.item_id == item_id,
        )
    )

    if not rating:
        raise HTTPException(
            status_code=404,
            detail="Rating not found",
        )

    return rating_response(rating)


@app.put(
    "/catalog/{item_id}/rating",
    response_model=RatingOut,
)
def set_my_rating(
    item_id: str,
    data: RatingIn,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    item = db.get(
        CatalogItem,
        item_id,
    )

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Catalog item not found",
        )

    rating = db.scalar(
        select(Rating).where(
            Rating.user_id == user.id,
            Rating.item_id == item_id,
        )
    )

    stored_value = int(
        data.stars * 2
    )

    if rating:
        rating.value = stored_value

    else:
        rating = Rating(
            user_id=user.id,
            item_id=item_id,
            value=stored_value,
        )

        db.add(rating)

    db.commit()
    db.refresh(rating)

    return rating_response(rating)


@app.delete(
    "/catalog/{item_id}/rating",
    status_code=204,
)
def delete_my_rating(
    item_id: str,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    rating = db.scalar(
        select(Rating).where(
            Rating.user_id == user.id,
            Rating.item_id == item_id,
        )
    )

    if not rating:
        raise HTTPException(
            status_code=404,
            detail="Rating not found",
        )

    db.delete(rating)
    db.commit()


# ---------------------------------------------------------
# Reviews
# ---------------------------------------------------------

@app.get(
    "/catalog/{item_id}/review",
    response_model=ReviewOut,
)
def get_my_review(
    item_id: str,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    review = db.scalar(
        select(Review).where(
            Review.user_id == user.id,
            Review.item_id == item_id,
        )
    )

    if not review:
        raise HTTPException(
            status_code=404,
            detail="Review not found",
        )

    return review


@app.put(
    "/catalog/{item_id}/review",
    response_model=ReviewOut,
)
def set_my_review(
    item_id: str,
    data: ReviewIn,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    item = db.get(
        CatalogItem,
        item_id,
    )

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Catalog item not found",
        )

    body = data.body.strip()

    if not body:
        raise HTTPException(
            status_code=422,
            detail="Review cannot be empty",
        )

    review = db.scalar(
        select(Review).where(
            Review.user_id == user.id,
            Review.item_id == item_id,
        )
    )

    if review:
        review.body = body

    else:
        review = Review(
            user_id=user.id,
            item_id=item_id,
            body=body,
        )

        db.add(review)

    db.commit()
    db.refresh(review)

    return review


@app.delete(
    "/catalog/{item_id}/review",
    status_code=204,
)
def delete_my_review(
    item_id: str,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    review = db.scalar(
        select(Review).where(
            Review.user_id == user.id,
            Review.item_id == item_id,
        )
    )

    if not review:
        raise HTTPException(
            status_code=404,
            detail="Review not found",
        )

    db.delete(review)
    db.commit()


# ---------------------------------------------------------
# Public collections
# ---------------------------------------------------------

@app.get(
    "/users/{username}/collection",
    response_model=list[PublicEntryOut],
)
def public_collection(
    username: str,
    db: Session = Depends(get_db),
):
    owner = db.scalar(
        select(User).where(
            User.username == username
        )
    )

    if not owner:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    query = (
        select(CollectionEntry)
        .options(
            joinedload(CollectionEntry.item)
        )
        .where(
            CollectionEntry.user_id == owner.id,
            CollectionEntry.visibility == "public",
        )
        .order_by(
            CollectionEntry.added_at.desc()
        )
    )

    return db.scalars(query).all()