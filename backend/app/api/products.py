from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, get_current_user, get_db_session
from app.schemas.products import (
    ProductCreateRequest,
    ProductListResponse,
    ProductResponse,
    ProductUpdateRequest,
)
from app.services.products import (
    DuplicateProductSkuError,
    ProductNotFoundError,
    ProductService,
    ProductValidationError,
)

ProductSortField = Literal["created_at", "name", "sku", "price", "quantity_in_stock"]
SortDirection = Literal["asc", "desc"]

router = APIRouter(prefix="/products", tags=["products"])


@router.post(
    "",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create product",
)
def create_product(
    payload: ProductCreateRequest,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_db_session)],
) -> ProductResponse:
    service = ProductService(session, current_user.organization_id)
    try:
        product = service.create_product(**payload.model_dump())
    except DuplicateProductSkuError as exc:
        raise product_error(status.HTTP_409_CONFLICT, "duplicate_sku", str(exc)) from exc
    except ProductValidationError as exc:
        raise product_error(status.HTTP_400_BAD_REQUEST, "invalid_product", str(exc)) from exc
    return ProductResponse.model_validate(product)


@router.get("", response_model=ProductListResponse, summary="List products")
def list_products(
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_db_session)],
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
    q: Annotated[str | None, Query(min_length=1, max_length=100)] = None,
    include_inactive: bool = False,
    sort_by: ProductSortField | None = None,
    sort_dir: SortDirection = "desc",
) -> ProductListResponse:
    service = ProductService(session, current_user.organization_id)
    products, total = service.list_products(
        limit=limit,
        offset=offset,
        search=q,
        include_inactive=include_inactive,
        sort_by=sort_by,
        sort_dir=sort_dir,
    )
    return ProductListResponse(
        items=[ProductResponse.model_validate(product) for product in products],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{product_id}", response_model=ProductResponse, summary="Get product")
def get_product(
    product_id: UUID,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_db_session)],
) -> ProductResponse:
    service = ProductService(session, current_user.organization_id)
    try:
        product = service.get_product(product_id)
    except ProductNotFoundError as exc:
        raise product_error(status.HTTP_404_NOT_FOUND, "product_not_found", str(exc)) from exc
    return ProductResponse.model_validate(product)


@router.put("/{product_id}", response_model=ProductResponse, summary="Update product")
def update_product(
    product_id: UUID,
    payload: ProductUpdateRequest,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_db_session)],
) -> ProductResponse:
    service = ProductService(session, current_user.organization_id)
    try:
        product = service.update_product(product_id, payload.model_dump(exclude_unset=True))
    except ProductNotFoundError as exc:
        raise product_error(status.HTTP_404_NOT_FOUND, "product_not_found", str(exc)) from exc
    except DuplicateProductSkuError as exc:
        raise product_error(status.HTTP_409_CONFLICT, "duplicate_sku", str(exc)) from exc
    except ProductValidationError as exc:
        raise product_error(status.HTTP_400_BAD_REQUEST, "invalid_product", str(exc)) from exc
    return ProductResponse.model_validate(product)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete product")
def delete_product(
    product_id: UUID,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_db_session)],
) -> Response:
    service = ProductService(session, current_user.organization_id)
    try:
        service.delete_product(product_id)
    except ProductNotFoundError as exc:
        raise product_error(status.HTTP_404_NOT_FOUND, "product_not_found", str(exc)) from exc
    except ProductValidationError as exc:
        raise product_error(status.HTTP_409_CONFLICT, "product_delete_conflict", str(exc)) from exc
    return Response(status_code=status.HTTP_204_NO_CONTENT)


def product_error(status_code: int, code: str, message: str) -> HTTPException:
    return HTTPException(
        status_code=status_code,
        detail={
            "code": code,
            "message": message,
        },
    )
