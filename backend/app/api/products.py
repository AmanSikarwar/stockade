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
from app.schemas.stock_movements import (
    StockAdjustRequest,
    StockMovementListResponse,
    StockMovementResponse,
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
    category_id: UUID | None = None,
) -> ProductListResponse:
    service = ProductService(session, current_user.organization_id)
    products, total = service.list_products(
        limit=limit,
        offset=offset,
        search=q,
        include_inactive=include_inactive,
        sort_by=sort_by,
        sort_dir=sort_dir,
        category_id=category_id,
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


@router.post(
    "/{product_id}/adjust-stock",
    response_model=ProductResponse,
    summary="Adjust product stock",
)
def adjust_stock(
    product_id: UUID,
    payload: StockAdjustRequest,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_db_session)],
) -> ProductResponse:
    service = ProductService(session, current_user.organization_id)
    try:
        product = service.adjust_stock(
            product_id,
            delta=payload.delta,
            reason=payload.reason,
            note=payload.note,
            actor_user_id=current_user.user.id,
        )
    except ProductNotFoundError as exc:
        raise product_error(status.HTTP_404_NOT_FOUND, "product_not_found", str(exc)) from exc
    except ProductValidationError as exc:
        raise product_error(status.HTTP_400_BAD_REQUEST, "invalid_adjustment", str(exc)) from exc
    return ProductResponse.model_validate(product)


@router.get(
    "/{product_id}/stock-movements",
    response_model=StockMovementListResponse,
    summary="List product stock movements",
)
def list_stock_movements(
    product_id: UUID,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_db_session)],
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> StockMovementListResponse:
    service = ProductService(session, current_user.organization_id)
    try:
        movements, total = service.list_stock_movements(product_id, limit=limit, offset=offset)
    except ProductNotFoundError as exc:
        raise product_error(status.HTTP_404_NOT_FOUND, "product_not_found", str(exc)) from exc
    return StockMovementListResponse(
        items=[
            StockMovementResponse(
                id=movement.id,
                product_id=movement.product_id,
                delta=movement.delta,
                resulting_quantity=movement.resulting_quantity,
                reason=movement.reason,
                note=movement.note,
                reference_order_id=movement.reference_order_id,
                created_by_user_id=movement.created_by_user_id,
                created_by_email=movement.created_by.email if movement.created_by else None,
                created_at=movement.created_at,
            )
            for movement in movements
        ],
        total=total,
        limit=limit,
        offset=offset,
    )


def product_error(status_code: int, code: str, message: str) -> HTTPException:
    return HTTPException(
        status_code=status_code,
        detail={
            "code": code,
            "message": message,
        },
    )
