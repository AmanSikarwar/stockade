from collections.abc import Iterable, Sequence
from dataclasses import dataclass
from decimal import Decimal
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.order import Order, OrderLineItem
from app.repositories.orders import OrderRepository

MONEY_QUANT = Decimal("0.01")


@dataclass(frozen=True)
class OrderLineInput:
    product_id: UUID
    quantity: int


@dataclass(frozen=True)
class StockShortfall:
    product_id: UUID
    requested: int
    available: int


class OrderError(Exception):
    """Base order-domain exception."""


class OrderNotFoundError(OrderError):
    pass


class OrderCustomerNotFoundError(OrderError):
    pass


class OrderProductNotFoundError(OrderError):
    def __init__(self, missing_product_ids: Sequence[UUID]) -> None:
        self.missing_product_ids = list(missing_product_ids)
        joined_ids = ", ".join(str(product_id) for product_id in self.missing_product_ids)
        super().__init__(f"Order references unknown or inactive products: {joined_ids}")


class InsufficientStockError(OrderError):
    def __init__(self, shortfalls: Sequence[StockShortfall]) -> None:
        self.shortfalls = list(shortfalls)
        messages = [
            f"{shortfall.product_id} requested {shortfall.requested}, "
            f"available {shortfall.available}"
            for shortfall in self.shortfalls
        ]
        super().__init__("Insufficient stock for: " + "; ".join(messages))


class OrderValidationError(OrderError):
    pass


class OrderService:
    def __init__(self, session: Session, organization_id: UUID) -> None:
        self.session = session
        self.repository = OrderRepository(session, organization_id)

    def create_order(self, *, customer_id: UUID, line_items: Sequence[OrderLineInput]) -> Order:
        quantities_by_product = aggregate_quantities(line_items)
        if not quantities_by_product:
            raise OrderValidationError("At least one order line item is required")

        try:
            customer = self.repository.get_customer_by_id(customer_id)
            if customer is None:
                raise OrderCustomerNotFoundError("Customer not found")

            ordered_product_ids = sorted(quantities_by_product, key=str)
            products = self.repository.get_active_products_for_update(ordered_product_ids)
            products_by_id = {product.id: product for product in products}
            missing_product_ids = [
                product_id for product_id in ordered_product_ids if product_id not in products_by_id
            ]
            if missing_product_ids:
                raise OrderProductNotFoundError(missing_product_ids)

            shortfalls = [
                StockShortfall(
                    product_id=product_id,
                    requested=quantity,
                    available=products_by_id[product_id].quantity_in_stock,
                )
                for product_id, quantity in quantities_by_product.items()
                if products_by_id[product_id].quantity_in_stock < quantity
            ]
            if shortfalls:
                raise InsufficientStockError(shortfalls)

            order_line_items: list[OrderLineItem] = []
            total_amount = Decimal("0.00")
            for product_id in ordered_product_ids:
                product = products_by_id[product_id]
                quantity = quantities_by_product[product_id]
                unit_price = normalize_money(product.price)
                line_total = normalize_money(unit_price * quantity)
                product.quantity_in_stock -= quantity
                total_amount += line_total
                order_line_items.append(
                    OrderLineItem(
                        product_id=product.id,
                        quantity_ordered=quantity,
                        unit_price=unit_price,
                        line_total=line_total,
                    )
                )

            order = self.repository.create_order(
                customer_id=customer.id,
                total_amount=normalize_money(total_amount),
                line_items=order_line_items,
            )
            self.session.commit()
        except OrderError:
            self.session.rollback()
            raise
        except IntegrityError as exc:
            self.session.rollback()
            raise OrderValidationError("Order could not be saved") from exc

        return self.get_order(order.id)

    def list_orders(
        self,
        *,
        limit: int,
        offset: int,
        status: str | None = None,
        customer_id: UUID | None = None,
        sort_by: str | None = None,
        sort_dir: str = "desc",
    ) -> tuple[list[Order], int]:
        return self.repository.list(
            limit=limit,
            offset=offset,
            status=status,
            customer_id=customer_id,
            sort_by=sort_by,
            sort_dir=sort_dir,
        )

    def get_order(self, order_id: UUID) -> Order:
        order = self.repository.get_by_id(order_id)
        if order is None:
            raise OrderNotFoundError("Order not found")
        return order

    def cancel_order(self, order_id: UUID) -> None:
        try:
            order = self.repository.get_by_id_for_update(order_id)
            if order is None:
                raise OrderNotFoundError("Order not found")
            if order.status == "cancelled":
                self.session.commit()
                return

            line_items = self.repository.get_line_items(order.id)
            product_ids = sorted({line_item.product_id for line_item in line_items}, key=str)
            products_by_id = {
                product.id: product
                for product in self.repository.get_products_for_update(product_ids)
            }

            for line_item in line_items:
                product = products_by_id[line_item.product_id]
                product.quantity_in_stock += line_item.quantity_ordered

            order.status = "cancelled"
            self.session.commit()
        except OrderError:
            self.session.rollback()
            raise
        except IntegrityError as exc:
            self.session.rollback()
            raise OrderValidationError("Order could not be cancelled") from exc


def aggregate_quantities(line_items: Iterable[OrderLineInput]) -> dict[UUID, int]:
    quantities_by_product: dict[UUID, int] = {}
    for line_item in line_items:
        if line_item.quantity <= 0:
            raise OrderValidationError("Line item quantity must be positive")
        quantities_by_product[line_item.product_id] = (
            quantities_by_product.get(line_item.product_id, 0) + line_item.quantity
        )
    return quantities_by_product


def normalize_money(value: Decimal) -> Decimal:
    return Decimal(str(value)).quantize(MONEY_QUANT)
