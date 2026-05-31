from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, get_current_user, get_db_session
from app.core.config import Settings, get_settings
from app.schemas.dashboard import DashboardLowStockProductResponse, DashboardMetricsResponse
from app.services.dashboard import DashboardService

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardMetricsResponse, summary="Get dashboard metrics")
def get_dashboard_metrics(
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_db_session)],
    settings: Annotated[Settings, Depends(get_settings)],
    low_stock_limit: Annotated[int, Query(ge=1, le=100)] = 10,
) -> DashboardMetricsResponse:
    metrics = DashboardService(session, current_user.organization_id).get_metrics(
        low_stock_threshold=settings.low_stock_threshold,
        low_stock_limit=low_stock_limit,
    )
    return DashboardMetricsResponse(
        total_products=metrics.total_products,
        total_active_products=metrics.total_active_products,
        total_customers=metrics.total_customers,
        total_orders=metrics.total_orders,
        total_active_orders=metrics.total_active_orders,
        total_cancelled_orders=metrics.total_cancelled_orders,
        low_stock_threshold=metrics.low_stock_threshold,
        low_stock_products_count=metrics.low_stock_products_count,
        low_stock_products=[
            DashboardLowStockProductResponse(
                id=product.id,
                name=product.name,
                sku=product.sku,
                price=product.price,
                quantity_in_stock=product.quantity_in_stock,
                reorder_point=product.reorder_point,
            )
            for product in metrics.low_stock_products
        ],
    )
