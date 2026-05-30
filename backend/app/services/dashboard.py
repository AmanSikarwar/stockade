from dataclasses import dataclass
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.product import Product
from app.repositories.dashboard import DashboardRepository


@dataclass(frozen=True)
class DashboardMetrics:
    total_products: int
    total_active_products: int
    total_customers: int
    total_orders: int
    total_active_orders: int
    total_cancelled_orders: int
    low_stock_threshold: int
    low_stock_products_count: int
    low_stock_products: list[Product]


class DashboardService:
    def __init__(self, session: Session, organization_id: UUID) -> None:
        self.repository = DashboardRepository(session, organization_id)

    def get_metrics(self, *, low_stock_threshold: int, low_stock_limit: int) -> DashboardMetrics:
        low_stock_products, low_stock_count = self.repository.low_stock_products(
            threshold=low_stock_threshold,
            limit=low_stock_limit,
        )
        return DashboardMetrics(
            total_products=self.repository.total_products(),
            total_active_products=self.repository.total_active_products(),
            total_customers=self.repository.total_customers(),
            total_orders=self.repository.total_orders(),
            total_active_orders=self.repository.total_orders_by_status("active"),
            total_cancelled_orders=self.repository.total_orders_by_status("cancelled"),
            low_stock_threshold=low_stock_threshold,
            low_stock_products_count=low_stock_count,
            low_stock_products=low_stock_products,
        )
