import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";

import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from "../api/categories";
import { useNotifications } from "../components/feedback/NotificationContext";
import { Icon } from "../components/icons/Icon";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { DataTable } from "../components/ui/DataTable";
import { FormField } from "../components/ui/FormField";
import { IconButton } from "../components/ui/IconButton";
import { ConfirmModal } from "../components/ui/Modal";
import { PageHeader } from "../components/ui/PageHeader";
import { Pill } from "../components/ui/Pill";
import { SearchField } from "../components/ui/SearchField";
import { TableSkeleton } from "../components/ui/Skeleton";

const PAGE_SIZE = 50;

export default function CategoriesPage() {
  const { notify } = useNotifications();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get("q") ?? "";
  const [search, setSearch] = useState(queryParam);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formCategory, setFormCategory] = useState(null);

  const categoriesQuery = useCategories({ limit: PAGE_SIZE, offset: 0, q: search || undefined });
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const rows = categoriesQuery.data?.items ?? [];
  const total = categoriesQuery.data?.total ?? 0;

  useEffect(() => {
    setSearch((current) => (current === queryParam ? current : queryParam));
  }, [queryParam]);

  const columns = [
    {
      header: "Category",
      key: "name",
      render: (category) => (
        <div className="product-cell">
          <span className="thumb">
            <Icon name="tag" size={16} stroke={1.9} />
          </span>
          <div className="identity">
            <div className="meta">
              <div className="name">{category.name}</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Products",
      key: "product_count",
      render: (category) => (
        <Pill tone={category.product_count > 0 ? "info" : "neutral"} dot={false}>
          {category.product_count} {category.product_count === 1 ? "product" : "products"}
        </Pill>
      ),
    },
    {
      header: "",
      key: "actions",
      align: "right",
      render: (category) => (
        <div className="row-actions">
          <IconButton
            icon="edit"
            label={`Edit ${category.name}`}
            variant="secondary"
            size="sm"
            onClick={() => openForm(category)}
          />
          <IconButton
            icon="trash"
            label={`Delete ${category.name}`}
            variant="secondary"
            size="sm"
            onClick={() => setDeleteTarget(category)}
          />
        </div>
      ),
    },
  ];

  function openForm(category) {
    createCategory.reset();
    updateCategory.reset();
    setFormCategory(category);
  }

  async function handleSubmit(name) {
    if (formCategory?.id) {
      const category = await updateCategory.mutateAsync({
        categoryId: formCategory.id,
        payload: { name },
      });
      notify({
        message: `${category.name} was updated.`,
        tone: "success",
        title: "Category saved",
      });
    } else {
      const category = await createCategory.mutateAsync({ name });
      notify({
        message: `${category.name} was created.`,
        tone: "success",
        title: "Category added",
      });
    }
    setFormCategory(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteCategory.mutateAsync(deleteTarget.id);
      notify({ message: `${deleteTarget.name} was deleted.`, tone: "success" });
      setDeleteTarget(null);
    } catch (error) {
      notify({
        message: error.message || "Unable to delete category.",
        title: "Delete failed",
        tone: "danger",
      });
    }
  }

  function updateSearch(value) {
    setSearch(value);
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set("q", value);
    } else {
      next.delete("q");
    }
    setSearchParams(next, { replace: true });
  }

  const mutationError = createCategory.error || updateCategory.error;
  const isSaving = createCategory.isPending || updateCategory.isPending;

  return (
    <div className="page">
      <PageHeader
        title="Categories"
        subtitle={`${total} ${total === 1 ? "category" : "categories"}`}
        actions={
          <Button icon="plus" onClick={() => openForm({})}>
            New category
          </Button>
        }
      />

      {formCategory ? (
        <CategoryFormCard
          category={formCategory}
          error={mutationError?.message}
          isSaving={isSaving}
          onCancel={() => setFormCategory(null)}
          onSubmit={handleSubmit}
        />
      ) : null}

      <Card
        title="All categories"
        count={total}
        toolbar={
          <SearchField
            label="Search categories"
            onChange={(event) => updateSearch(event.target.value)}
            placeholder="Search categories…"
            value={search}
          />
        }
      >
        {categoriesQuery.isPending ? (
          <TableSkeleton columns={columns} />
        ) : categoriesQuery.isError ? (
          <div className="card-pad">
            <Alert tone="danger" title="Categories unavailable">
              {categoriesQuery.error.message || "Unable to load categories."}
            </Alert>
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            empty={
              <div className="empty-state">
                <Icon name="tag" size={40} stroke={1.4} />
                <h3>No categories yet</h3>
                <p>Group products into categories to filter your catalog faster.</p>
                <Button icon="plus" onClick={() => openForm({})}>
                  New category
                </Button>
              </div>
            }
          />
        )}
      </Card>

      {deleteTarget ? (
        <ConfirmModal
          title="Delete this category?"
          message={
            deleteTarget.product_count > 0
              ? `“${deleteTarget.name}” is used by ${deleteTarget.product_count} ${
                  deleteTarget.product_count === 1 ? "product" : "products"
                }. They will keep their data but lose this category.`
              : `“${deleteTarget.name}” will be removed.`
          }
          confirmLabel="Delete category"
          isLoading={deleteCategory.isPending}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      ) : null}
    </div>
  );
}

function CategoryFormCard({ category, error, isSaving, onCancel, onSubmit }) {
  const isEditing = Boolean(category.id);
  const [name, setName] = useState(category.name ?? "");
  const [validationError, setValidationError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setValidationError("Category name is required.");
      return;
    }
    setValidationError("");
    try {
      await onSubmit(trimmed);
    } catch {
      // Mutation error renders through the shared alert below.
    }
  }

  return (
    <Card title={isEditing ? "Edit category" : "New category"} pad>
      <form onSubmit={handleSubmit} className="stack">
        <FormField
          id="category-name"
          label="Name"
          maxLength="120"
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Packaging"
          required
          value={name}
        />

        {validationError ? <Alert tone="warning">{validationError}</Alert> : null}
        {error ? <Alert tone="danger">{error}</Alert> : null}

        <div className="form-actions">
          <Button icon="check" isLoading={isSaving} type="submit">
            {isEditing ? "Save category" : "Create category"}
          </Button>
          <Button onClick={onCancel} type="button" variant="secondary">
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
