from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload
from .config import settings
from .database import get_db
from .models import User, CatalogItem, CollectionEntry
from .schemas import RegisterIn, LoginIn, UserOut, TokenOut, EntryIn, EntryOut, EntryPatch
from .security import hasher, make_token, current_user

app = FastAPI(title="MyBookNook API", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=[settings.frontend_origin],
                   allow_credentials=True, allow_methods=["*"], allow_headers=["*"])



@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/auth/register", response_model=UserOut, status_code=201)
def register(data: RegisterIn, db: Session = Depends(get_db)):
    user = User(username=data.username.strip(), email=data.email.lower(),
                password_hash=hasher.hash(data.password))
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Username or email already in use")
    db.refresh(user)
    return user

@app.post("/auth/login", response_model=TokenOut)
def login(data: LoginIn, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == data.email.lower()))
    if not user or not hasher.verify(data.password, user.password_hash):
        raise HTTPException(401, "Invalid email or password")
    return TokenOut(access_token=make_token(user.id))

@app.get("/users/me", response_model=UserOut)
def me(user: User = Depends(current_user)):
    return user

@app.get("/collection", response_model=list[EntryOut])
def my_collection(kind: str | None = None, user: User = Depends(current_user),
                  db: Session = Depends(get_db)):
    query = (select(CollectionEntry).options(joinedload(CollectionEntry.item))
             .where(CollectionEntry.user_id == user.id)
             .order_by(CollectionEntry.added_at.desc()))
    if kind:
        query = query.join(CatalogItem).where(CatalogItem.kind == kind)
    return db.scalars(query).all()

@app.post("/collection", response_model=EntryOut, status_code=201)
def add_to_collection(data: EntryIn, user: User = Depends(current_user),
                      db: Session = Depends(get_db)):
    item = None
    if data.item.identifier:
        item = db.scalar(select(CatalogItem).where(
            CatalogItem.kind == data.item.kind,
            CatalogItem.identifier == data.item.identifier))
    if item is None:
        item = CatalogItem(**data.item.model_dump())
        db.add(item)
        db.flush()
    existing = db.scalar(select(CollectionEntry).where(
        CollectionEntry.user_id == user.id, CollectionEntry.item_id == item.id))
    if existing:
        raise HTTPException(409, "Already in your collection")
    entry = CollectionEntry(user_id=user.id, item_id=item.id,
                            status=data.status, visibility=data.visibility)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

@app.patch("/collection/{entry_id}", response_model=EntryOut)
def update_entry(entry_id: str, data: EntryPatch, user: User = Depends(current_user),
                 db: Session = Depends(get_db)):
    entry = db.scalar(select(CollectionEntry).where(
        CollectionEntry.id == entry_id, CollectionEntry.user_id == user.id))
    if not entry:
        raise HTTPException(404, "Collection entry not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(entry, key, value)
    db.commit()
    db.refresh(entry)
    return entry

@app.delete("/collection/{entry_id}", status_code=204)
def delete_entry(entry_id: str, user: User = Depends(current_user),
                 db: Session = Depends(get_db)):
    entry = db.scalar(select(CollectionEntry).where(
        CollectionEntry.id == entry_id, CollectionEntry.user_id == user.id))
    if not entry:
        raise HTTPException(404, "Collection entry not found")
    db.delete(entry)
    db.commit()

@app.get("/users/{username}/collection", response_model=list[EntryOut])
def public_collection(username: str, db: Session = Depends(get_db)):
    owner = db.scalar(select(User).where(User.username == username))
    if not owner:
        raise HTTPException(404, "User not found")
    return db.scalars(
        select(CollectionEntry).options(joinedload(CollectionEntry.item))
        .where(CollectionEntry.user_id == owner.id, CollectionEntry.visibility == "public")
        .order_by(CollectionEntry.added_at.desc())
    ).all()
