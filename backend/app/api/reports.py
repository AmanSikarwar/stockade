from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, get_current_user, get_db_session
from app.schemas.reports import (
    CustomerSalesResponse,
    RevenueOverTimeResponse,
    RevenuePointResponse,
    SalesByCustomerResponse,
    TopProductResponse,
    TopProductsResponse,
)
from app.services.reports import ReportsService

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get(
    "/revenue-over-time",
    response_model=RevenueOverTimeResponse,
    summary="Revenue and order counts per day",
)
def revenue_over_time(
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_db_session)],
    days: Annotated[int, Query(ge=1, le=365)] = 30,
) -> RevenueOverTimeResponse:
    report = ReportsService(session, current_user.organization_id).revenue_over_time(days=days)
    return RevenueOverTimeResponse(
        days=report.days,
        total_revenue=report.total_revenue,
        total_orders=report.total_orders,
        points=[
            RevenuePointResponse(
                date=point.day,
                revenue=point.revenue,
                order_count=point.order_count,
            )
            for point in report.points
        ],
    )


@router.get(
    "/top-products",
    response_model=TopProductsResponse,
    summary="Best-selling products by revenue",
)
def top_products(
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_db_session)],
    limit: Annotated[int, Query(ge=1, le=50)] = 10,
) -> TopProductsResponse:
    products = ReportsService(session, current_user.organization_id).top_products(limit=limit)
    return TopProductsResponse(
        items=[
            TopProductResponse(
                product_id=product.product_id,
                name=product.name,
                sku=product.sku,
                quantity_sold=product.quantity_sold,
                revenue=product.revenue,
            )
            for product in products
        ]
    )


@router.get(
    "/sales-by-customer",
    response_model=SalesByCustomerResponse,
    summary="Revenue and order counts per customer",
)
def sales_by_customer(
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_db_session)],
    limit: Annotated[int, Query(ge=1, le=50)] = 10,
) -> SalesByCustomerResponse:
    customers = ReportsService(session, current_user.organization_id).sales_by_customer(limit=limit)
    return SalesByCustomerResponse(
        items=[
            CustomerSalesResponse(
                customer_id=customer.customer_id,
                full_name=customer.full_name,
                order_count=customer.order_count,
                revenue=customer.revenue,
            )
            for customer in customers
        ]
    )
