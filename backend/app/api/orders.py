from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, get_current_user, get_db_session
from app.models.order import Order
from app.schemas.orders import (
    OrderCreateRequest,
    OrderLineItemResponse,
    OrderListResponse,
    OrderResponse,
    OrderSummaryResponse,
)
from app.services.orders import (
    InsufficientStockError,
    OrderCustomerNotFoundError,
    OrderLineInput,
    OrderNotFoundError,
    OrderProductNotFoundError,
    OrderService,
    OrderValidationError,
)

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post(
    "",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create order",
)
def create_order(
    payload: OrderCreateRequest,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_db_session)],
) -> OrderResponse:
    service = OrderService(session, current_user.organization_id)
    line_items = [
        OrderLineInput(product_id=line_item.product_id, quantity=line_item.quantity)
        for line_item in payload.line_items
    ]
    try:
        order = service.create_order(
            customer_id=payload.customer_id,
            line_items=line_items,
            actor_user_id=current_user.user.id,
        )
    except OrderCustomerNotFoundError as exc:
        raise order_error(status.HTTP_404_NOT_FOUND, "customer_not_found", str(exc)) from exc
    except OrderProductNotFoundError as exc:
        raise order_error(
            status.HTTP_404_NOT_FOUND,
            "product_not_found",
            str(exc),
            {"missing_product_ids": [str(product_id) for product_id in exc.missing_product_ids]},
        ) from exc
    except InsufficientStockError as exc:
        raise order_error(
            status.HTTP_409_CONFLICT,
            "insufficient_stock",
            str(exc),
            {
                "shortfalls": [
                    {
                        "product_id": str(shortfall.product_id),
                        "requested": shortfall.requested,
                        "available": shortfall.available,
                    }
                    for shortfall in exc.shortfalls
                ]
            },
        ) from exc
    except OrderValidationError as exc:
        raise order_error(status.HTTP_400_BAD_REQUEST, "invalid_order", str(exc)) from exc
    return build_order_response(order)


@router.get("", response_model=OrderListResponse, summary="List orders")
def list_orders(
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_db_session)],
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
    order_status: Annotated[Literal["active", "cancelled"] | None, Query(alias="status")] = None,
    customer_id: UUID | None = None,
    sort_by: Annotated[Literal["created_at", "total_amount", "status"] | None, Query()] = None,
    sort_dir: Annotated[Literal["asc", "desc"], Query()] = "desc",
) -> OrderListResponse:
    service = OrderService(session, current_user.organization_id)
    orders, total = service.list_orders(
        limit=limit,
        offset=offset,
        status=order_status,
        customer_id=customer_id,
        sort_by=sort_by,
        sort_dir=sort_dir,
    )
    return OrderListResponse(
        items=[
            OrderSummaryResponse(
                id=order.id,
                customer_id=order.customer_id,
                customer_name=order.customer.full_name if order.customer else None,
                status=order.status,
                total_amount=order.total_amount,
                created_at=order.created_at,
                updated_at=order.updated_at,
            )
            for order in orders
        ],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{order_id}", response_model=OrderResponse, summary="Get order")
def get_order(
    order_id: UUID,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_db_session)],
) -> OrderResponse:
    service = OrderService(session, current_user.organization_id)
    try:
        order = service.get_order(order_id)
    except OrderNotFoundError as exc:
        raise order_error(status.HTTP_404_NOT_FOUND, "order_not_found", str(exc)) from exc
    return build_order_response(order)


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Cancel order")
def cancel_order(
    order_id: UUID,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_db_session)],
) -> Response:
    service = OrderService(session, current_user.organization_id)
    try:
        service.cancel_order(order_id, actor_user_id=current_user.user.id)
    except OrderNotFoundError as exc:
        raise order_error(status.HTTP_404_NOT_FOUND, "order_not_found", str(exc)) from exc
    except OrderValidationError as exc:
        raise order_error(status.HTTP_400_BAD_REQUEST, "invalid_order", str(exc)) from exc
    return Response(status_code=status.HTTP_204_NO_CONTENT)


def build_order_response(order: Order) -> OrderResponse:
    line_items = [
        OrderLineItemResponse(
            id=line_item.id,
            product_id=line_item.product_id,
            product_sku=line_item.product.sku,
            product_name=line_item.product.name,
            quantity_ordered=line_item.quantity_ordered,
            unit_price=line_item.unit_price,
            line_total=line_item.line_total,
        )
        for line_item in order.line_items
    ]
    return OrderResponse(
        id=order.id,
        customer_id=order.customer_id,
        customer_name=order.customer.full_name if order.customer else None,
        status=order.status,
        total_amount=order.total_amount,
        created_at=order.created_at,
        updated_at=order.updated_at,
        line_items=line_items,
    )


def order_error(
    status_code: int,
    code: str,
    message: str,
    extra: dict[str, object] | None = None,
) -> HTTPException:
    detail: dict[str, object] = {
        "code": code,
        "message": message,
    }
    if extra:
        detail.update(extra)
    return HTTPException(status_code=status_code, detail=detail)
