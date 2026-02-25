/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import {
    Plus,
    MoreHorizontal,
    Pencil,
    Trash2,
    Search,
    RefreshCcw
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Modal,
    Form,
    Input as AntInput,
    Switch,
    message,
    Popconfirm
} from "antd";
import {
    GetProductCategories,
    CreateProductCategory,
    UpdateProductCategory,
    DeleteProductCategory
} from "@/(api-handlers)/productCategoriesHandler";
import {
    ProductCategoriesResponse,
    ProductCategoriesRequest
} from "@/interfaces/productCategories";
import { toast } from "react-hot-toast";

export default function ProductCategoryPage() {
    const [categories, setCategories] = useState<ProductCategoriesResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingCategory, setEditingCategory] = useState<ProductCategoriesResponse | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [form] = Form.useForm();

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const data = await GetProductCategories();
            setCategories(data);
        } catch (error) {
            console.error("Failed to fetch categories:", error);
            toast.error("Failed to load product categories");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const showModal = (category: ProductCategoriesResponse | null = null) => {
        setEditingCategory(category);
        if (category) {
            form.setFieldsValue({
                name: category.name,
                description: category.description,
                is_active: category.is_active,
            });
        } else {
            form.resetFields();
            form.setFieldsValue({ is_active: true });
        }
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setEditingCategory(null);
        form.resetFields();
    };

    const onFinish = async (values: any) => {
        setSubmitting(true);
        try {
            const categoryData: ProductCategoriesRequest = {
                name: values.name,
                description: values.description || "",
                is_active: values.is_active ?? true,
            };

            if (editingCategory) {
                await UpdateProductCategory(editingCategory.id, categoryData);
                toast.success("Category updated successfully");
            } else {
                await CreateProductCategory(categoryData);
                toast.success("Category created successfully");
            }
            handleCancel();
            fetchCategories();
        } catch (error) {
            console.error("Operation failed:", error);
            toast.error(editingCategory ? "Failed to update category" : "Failed to create category");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await DeleteProductCategory(id);
            toast.success("Category deleted successfully");
            fetchCategories();
        } catch (error) {
            console.error("Delete failed:", error);
            toast.error("Failed to delete category");
        }
    };

    const filteredCategories = categories.filter(
        (cat) =>
            cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cat.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Product Categories</h1>
                    <p className="text-muted-foreground">
                        Manage your product categories and their visibility.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={fetchCategories} disabled={loading}>
                        <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                    <Button onClick={() => showModal()} className="bg-primary text-primary-foreground">
                        <Plus className="mr-2 h-4 w-4" /> Add Category
                    </Button>
                </div>
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search categories..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[200px]">Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="w-[120px]">Status</TableHead>
                            <TableHead className="w-[150px]">Created At</TableHead>
                            <TableHead className="text-right w-[80px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><div className="h-4 w-24 animate-pulse bg-muted rounded" /></TableCell>
                                    <TableCell><div className="h-4 w-48 animate-pulse bg-muted rounded" /></TableCell>
                                    <TableCell><div className="h-4 w-16 animate-pulse bg-muted rounded" /></TableCell>
                                    <TableCell><div className="h-4 w-24 animate-pulse bg-muted rounded" /></TableCell>
                                    <TableCell className="text-right"><div className="h-4 w-8 animate-pulse bg-muted rounded ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : filteredCategories.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No categories found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredCategories.map((category) => (
                                <TableRow key={category.id} className="group hover:bg-muted/50 transition-colors">
                                    <TableCell className="font-medium">{category.name}</TableCell>
                                    <TableCell className="text-muted-foreground line-clamp-1">
                                        {category.description || "-"}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={category.is_active ? "default" : "secondary"}>
                                            {category.is_active ? "Active" : "Inactive"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {new Date(category.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-[160px]">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => showModal(category)}>
                                                    <Pencil className="mr-2 h-4 w-4" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <Popconfirm
                                                    title="Delete Category"
                                                    description="Are you sure you want to delete this category?"
                                                    onConfirm={() => handleDelete(category.id)}
                                                    okText="Yes"
                                                    cancelText="No"
                                                    okButtonProps={{ danger: true }}
                                                >
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onSelect={(e) => e.preventDefault()}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                    </DropdownMenuItem>
                                                </Popconfirm>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Modal
                title={editingCategory ? "Edit Category" : "Add New Category"}
                open={isModalVisible}
                onCancel={handleCancel}
                footer={null}
                destroyOnClose
                centered
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    initialValues={{ is_active: true }}
                    className="mt-4"
                >
                    <Form.Item
                        name="name"
                        label="Category Name"
                        rules={[{ required: true, message: "Please enter category name" }]}
                    >
                        <AntInput placeholder="e.g. Electronics, Beverages" size="large" />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Description"
                    >
                        <AntInput.TextArea
                            placeholder="Brief description of this category"
                            rows={4}
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item
                        name="is_active"
                        label="Status"
                        valuePropName="checked"
                    >
                        <div className="flex items-center gap-2">
                            <Switch />
                            <span className="text-sm text-muted-foreground">
                                {form.getFieldValue("is_active") ? "Active" : "Inactive"}
                            </span>
                        </div>
                    </Form.Item>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" type="button" onClick={handleCancel}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting ? "Saving..." : editingCategory ? "Update Category" : "Create Category"}
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
}