from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import httpx

from app.database import get_db
from app.models.user import User, UserRole, AuthProvider
from app.schemas.user import UserCreate, UserLogin, UserResponse, UserUpdate, Token
from app.utils.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    verify_refresh_token,
)
from app.utils.deps import get_current_user
from app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=Token)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """회원가입"""
    # 이메일 중복 체크
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 등록된 이메일입니다.",
        )

    # 사용자 생성
    user = User(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        name=user_data.name,
        phone=user_data.phone,
        role=UserRole.USER,
        provider=AuthProvider.EMAIL,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # 토큰 생성
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    return Token(
        accessToken=access_token,
        refreshToken=refresh_token,
        user=UserResponse.from_orm_with_mapping(user),
    )


@router.post("/login", response_model=Token)
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """로그인"""
    user = db.query(User).filter(User.email == user_data.email).first()

    if not user or not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="이메일 또는 비밀번호가 올바르지 않습니다.",
        )

    if not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="이메일 또는 비밀번호가 올바르지 않습니다.",
        )

    # 토큰 생성
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    return Token(
        accessToken=access_token,
        refreshToken=refresh_token,
        user=UserResponse.from_orm_with_mapping(user),
    )


@router.post("/refresh")
async def refresh_token(refresh_token: str, db: Session = Depends(get_db)):
    """토큰 갱신"""
    user_id = verify_refresh_token(refresh_token)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않은 리프레시 토큰입니다.",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="사용자를 찾을 수 없습니다.",
        )

    new_access_token = create_access_token(user.id)
    new_refresh_token = create_refresh_token(user.id)

    return {
        "accessToken": new_access_token,
        "refreshToken": new_refresh_token,
    }


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """현재 사용자 정보 조회"""
    return UserResponse.from_orm_with_mapping(current_user)


@router.put("/me", response_model=UserResponse)
async def update_me(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """현재 사용자 정보 수정"""
    if user_data.name is not None:
        current_user.name = user_data.name
    if user_data.phone is not None:
        current_user.phone = user_data.phone

    db.commit()
    db.refresh(current_user)

    return UserResponse.from_orm_with_mapping(current_user)


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """로그아웃"""
    # JWT는 서버 측에서 무효화할 수 없으므로 클라이언트에서 토큰을 삭제합니다
    return {"message": "로그아웃되었습니다."}


# Google OAuth
@router.get("/social/google")
async def google_login():
    """Google 로그인 URL 리다이렉트"""
    google_auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={settings.GOOGLE_CLIENT_ID}"
        f"&redirect_uri={settings.GOOGLE_REDIRECT_URI}"
        f"&response_type=code"
        f"&scope=email%20profile"
    )
    return {"url": google_auth_url}


@router.post("/social/google/callback", response_model=Token)
async def google_callback(code: str, db: Session = Depends(get_db)):
    """Google OAuth 콜백"""
    # 액세스 토큰 요청
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            },
        )

        if token_response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google 인증에 실패했습니다.",
            )

        tokens = token_response.json()
        access_token = tokens.get("access_token")

        # 사용자 정보 요청
        user_response = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )

        if user_response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google 사용자 정보를 가져오는데 실패했습니다.",
            )

        user_info = user_response.json()

    # 사용자 조회 또는 생성
    user = db.query(User).filter(
        User.provider == AuthProvider.GOOGLE,
        User.provider_id == user_info["id"],
    ).first()

    if not user:
        # 이메일로 기존 사용자 확인
        existing_user = db.query(User).filter(User.email == user_info["email"]).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 다른 방법으로 가입된 이메일입니다.",
            )

        user = User(
            email=user_info["email"],
            name=user_info.get("name", user_info["email"].split("@")[0]),
            role=UserRole.USER,
            provider=AuthProvider.GOOGLE,
            provider_id=user_info["id"],
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # 토큰 생성
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    return Token(
        accessToken=access_token,
        refreshToken=refresh_token,
        user=UserResponse.from_orm_with_mapping(user),
    )


# Kakao OAuth
@router.get("/social/kakao")
async def kakao_login():
    """Kakao 로그인 URL 리다이렉트"""
    kakao_auth_url = (
        f"https://kauth.kakao.com/oauth/authorize"
        f"?client_id={settings.KAKAO_CLIENT_ID}"
        f"&redirect_uri={settings.KAKAO_REDIRECT_URI}"
        f"&response_type=code"
    )
    return {"url": kakao_auth_url}


@router.post("/social/kakao/callback", response_model=Token)
async def kakao_callback(code: str, db: Session = Depends(get_db)):
    """Kakao OAuth 콜백"""
    async with httpx.AsyncClient() as client:
        # 액세스 토큰 요청
        token_response = await client.post(
            "https://kauth.kakao.com/oauth/token",
            data={
                "grant_type": "authorization_code",
                "client_id": settings.KAKAO_CLIENT_ID,
                "client_secret": settings.KAKAO_CLIENT_SECRET,
                "redirect_uri": settings.KAKAO_REDIRECT_URI,
                "code": code,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )

        if token_response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Kakao 인증에 실패했습니다.",
            )

        tokens = token_response.json()
        access_token = tokens.get("access_token")

        # 사용자 정보 요청
        user_response = await client.get(
            "https://kapi.kakao.com/v2/user/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )

        if user_response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Kakao 사용자 정보를 가져오는데 실패했습니다.",
            )

        user_info = user_response.json()

    kakao_id = str(user_info["id"])
    kakao_account = user_info.get("kakao_account", {})
    email = kakao_account.get("email")
    profile = kakao_account.get("profile", {})
    nickname = profile.get("nickname", f"kakao_{kakao_id}")

    # 사용자 조회 또는 생성
    user = db.query(User).filter(
        User.provider == AuthProvider.KAKAO,
        User.provider_id == kakao_id,
    ).first()

    if not user:
        if email:
            existing_user = db.query(User).filter(User.email == email).first()
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="이미 다른 방법으로 가입된 이메일입니다.",
                )

        user = User(
            email=email or f"kakao_{kakao_id}@kakao.local",
            name=nickname,
            role=UserRole.USER,
            provider=AuthProvider.KAKAO,
            provider_id=kakao_id,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # 토큰 생성
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    return Token(
        accessToken=access_token,
        refreshToken=refresh_token,
        user=UserResponse.from_orm_with_mapping(user),
    )
