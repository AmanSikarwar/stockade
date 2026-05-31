from dataclasses import dataclass
from datetime import UTC, date, datetime, timedelta
from decimal import Decimal
from uuid import UUID

from sqlalchemy.orm import Session

from app.repositories.reports import ReportsRepository

MONEY_QUANT = Decimal("0.01")


def _money(value: object) -> Decimal:
    return Decimal(str(value or 0)).quantize(MONEY_QUANT)


@dataclass(frozen=True)
class RevenuePoint:
    day: date
    revenue: Decimal
    order_count: int


@dataclass(frozen=True)
class RevenueOverTime:
    days: int
    total_revenue: Decimal
    total_orders: int
    points: list[RevenuePoint]


@dataclass(frozen=True)
class TopProduct:
    product_id: UUID
    name: str
    sku: str
    quantity_sold: int
    revenue: Decimal


@dataclass(frozen=True)
class CustomerSales:
    customer_id: UUID
    full_name: str
    order_count: int
    revenue: Decimal


class ReportsService:
    def __init__(self, session: Session, organization_id: UUID) -> None:
        self.repository = ReportsRepository(session, organization_id)

    def revenue_over_time(self, *, days: int) -> RevenueOverTime:
        today = datetime.now(UTC).date()
        start_date = today - timedelta(days=days - 1)
        start_dt = datetime(start_date.year, start_date.month, start_date.day, tzinfo=UTC)

        by_day: dict[date, tuple[Decimal, int]] = {}
        for raw_day, revenue, order_count in self.repository.revenue_since(start_dt):
            day_value = raw_day.date() if isinstance(raw_day, datetime) else raw_day
            by_day[day_value] = (_money(revenue), int(order_count))

        points: list[RevenuePoint] = []
        total_revenue = Decimal("0.00")
        total_orders = 0
        for offset in range(days):
            current = start_date + timedelta(days=offset)
            revenue, order_count = by_day.get(current, (Decimal("0.00"), 0))
            total_revenue += revenue
            total_orders += order_count
            points.append(RevenuePoint(day=current, revenue=revenue, order_count=order_count))

        return RevenueOverTime(
            days=days,
            total_revenue=total_revenue,
            total_orders=total_orders,
            points=points,
        )

    def top_products(self, *, limit: int) -> list[TopProduct]:
        return [
            TopProduct(
                product_id=product_id,
                name=name,
                sku=sku,
                quantity_sold=int(quantity_sold or 0),
                revenue=_money(revenue),
            )
            for product_id, name, sku, quantity_sold, revenue in self.repository.top_products(limit)
        ]

    def sales_by_customer(self, *, limit: int) -> list[CustomerSales]:
        return [
            CustomerSales(
                customer_id=customer_id,
                full_name=full_name,
                order_count=int(order_count or 0),
                revenue=_money(revenue),
            )
            for customer_id, full_name, order_count, revenue in self.repository.sales_by_customer(
                limit
            )
        ]
