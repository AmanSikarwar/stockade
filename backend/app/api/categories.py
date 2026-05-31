from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, get_current_user, get_db_session
from app.models.category import Category
from app.schemas.categories import (
    CategoryCreateRequest,
    CategoryListResponse,
    CategoryResponse,
    CategoryUpdateRequest,
)
from app.services.categories import (
    CategoryNotFoundError,
    CategoryService,
    CategoryValidationError,
    DuplicateCategoryNameError,
)

router = APIRouter(prefix="/categories", tags=["categories"])


def _response(category: Category, product_count: int) -> CategoryResponse:
    return CategoryResponse(
        id=category.id,
        name=category.name,
        product_count=product_count,
        created_at=category.created_at,
        updated_at=category.updated_at,
    )


@router.post(
    "",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create category",
)
def create_category(
    payload: CategoryCreateRequest,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_db_session)],
) -> CategoryResponse:
    service = CategoryService(session, current_user.organization_id)
    try:
        category = service.create_category(**payload.model_dump())
    except DuplicateCategoryNameError as exc:
        raise category_error(status.HTTP_409_CONFLICT, "duplicate_category", str(exc)) from exc
    except CategoryValidationError as exc:
        raise category_error(status.HTTP_400_BAD_REQUEST, "invalid_category", str(exc)) from exc
    return _response(category, 0)


@router.get("", response_model=CategoryListResponse, summary="List categories")
def list_categories(
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_db_session)],
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
    q: Annotated[str | None, Query(min_length=1, max_length=120)] = None,
) -> CategoryListResponse:
    service = CategoryService(session, current_user.organization_id)
    items, total = service.list_categories(limit=limit, offset=offset, search=q)
    return CategoryListResponse(
        items=[_response(item.category, item.product_count) for item in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{category_id}", response_model=CategoryResponse, summary="Get category")
def get_category(
    category_id: UUID,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_db_session)],
) -> CategoryResponse:
    service = CategoryService(session, current_user.organization_id)
    try:
        category = service.get_category(category_id)
    except CategoryNotFoundError as exc:
        raise category_error(status.HTTP_404_NOT_FOUND, "category_not_found", str(exc)) from exc
    return _response(category, service.repository.product_count(category.id))


@router.put("/{category_id}", response_model=CategoryResponse, summary="Update category")
def update_category(
    category_id: UUID,
    payload: CategoryUpdateRequest,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_db_session)],
) -> CategoryResponse:
    service = CategoryService(session, current_user.organization_id)
    try:
        category = service.update_category(category_id, payload.model_dump(exclude_unset=True))
    except CategoryNotFoundError as exc:
        raise category_error(status.HTTP_404_NOT_FOUND, "category_not_found", str(exc)) from exc
    except DuplicateCategoryNameError as exc:
        raise category_error(status.HTTP_409_CONFLICT, "duplicate_category", str(exc)) from exc
    except CategoryValidationError as exc:
        raise category_error(status.HTTP_400_BAD_REQUEST, "invalid_category", str(exc)) from exc
    return _response(category, service.repository.product_count(category.id))


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete category")
def delete_category(
    category_id: UUID,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_db_session)],
) -> Response:
    service = CategoryService(session, current_user.organization_id)
    try:
        service.delete_category(category_id)
    except CategoryNotFoundError as exc:
        raise category_error(status.HTTP_404_NOT_FOUND, "category_not_found", str(exc)) from exc
    return Response(status_code=status.HTTP_204_NO_CONTENT)


def category_error(status_code: int, code: str, message: str) -> HTTPException:
    return HTTPException(
        status_code=status_code,
        detail={
            "code": code,
            "message": message,
        },
    )
