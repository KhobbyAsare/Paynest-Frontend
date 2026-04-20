/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Plus,
    MoreHorizontal,
    Pencil,
    Trash2,
    Search,
    RefreshCcw,
    Barcode,
    Package,
    Tag,
    Layers,
    FilterX,
    DollarSign,
    Percent,
    CheckCircle,
    XCircle,
    TrendingUp,
    TrendingDown,
    Eye,
    Calendar,
    Clock,
    Building2,
    X
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Modal,
    Form,
    Input as AntInput,
    InputNumber,
    Switch,
    Popconfirm,
    Row,
    Col,
    Divider,
    Space,
    Typography,
    theme,
    Tooltip
} from "antd";
import {
    GetProducts,
    CreateProduct,
    UpdateProdctDetails,
    DeleteProduct
} from "@/(api-handlers)/productsHandler";
import {
    GetProductCategories
} from "@/(api-handlers)/productCategoriesHandler";
import {
    ProductResponse,
    ProductRequest
} from "@/interfaces/products";
import {
    ProductCategoriesResponse
} from "@/interfaces/productCategories";
import { getOrganizationShops } from "@/(api-handlers)/organizationShopsHandler";
import { useAuthStore } from "@/(zustand-store)/authStore";
import { OrganizationShopResponse } from "@/interfaces/organizationShops";
import { toast } from "sonner";
import PageHeader from "@/components/(shared-components)/PageHeader";

const { Text } = Typography;

export default function ProductsPage() {
    const [products, setProducts] = useState<ProductResponse[]>([]);
    const [categories, setCategories] = useState<ProductCategoriesResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState<ProductResponse | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [form] = Form.useForm();
    const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
    const [viewingProduct, setViewingProduct] = useState<ProductResponse | null>(null);
    const { token } = theme.useToken();

    // Shop filtering
    const { user } = useAuthStore();
    const [shops, setShops] = useState<OrganizationShopResponse[]>([]);
    const [selectedShopId, setSelectedShopId] = useState<string>("all");
    const role = (user?.role || "attendant").toLowerCase();
    const isAdmin = role === 'admin' || role === 'superadmin';

    const fetchShops = useCallback(async () => {
        if (!isAdmin) return;
        try {
            const data = await getOrganizationShops();
            setShops(data);
        } catch (error) {
            console.error("Failed to fetch shops:", error);
        }
    }, [isAdmin]);

    useEffect(() => {
        fetchShops();
    }, [fetchShops]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const shopIdParams = selectedShopId === 'all' ? undefined : Number(selectedShopId);
            const [productsData, categoriesData] = await Promise.all([
                GetProducts(shopIdParams),
                GetProductCategories()
            ]);
            setProducts(productsData);
            setCategories(categoriesData);
        } catch (error) {
            console.error("Failed to fetch data:", error);
            toast.error("Failed to load products or categories");
        } finally {
            setLoading(false);
        }
    }, [selectedShopId]);

    useEffect(() => {
        fetchData();
    }, [fetchData, selectedShopId]);

    const showModal = (product: ProductResponse | null = null) => {
        setEditingProduct(product);
        if (product) {
            form.setFieldsValue({
                ...product,
            });
        } else {
            form.resetFields();
            form.setFieldsValue({
                is_active: true,
                is_taxable: true,
                tax_rate: 0,
                markup_percentage: 0
            });
        }
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setEditingProduct(null);
        form.resetFields();
    };

    const showDetailsModal = (product: ProductResponse) => {
        setViewingProduct(product);
        setIsDetailsModalVisible(true);
    };

    const handleDetailsCancel = () => {
        setIsDetailsModalVisible(false);
        setViewingProduct(null);
    };

    const onFinish = async (values: any) => {
        setSubmitting(true);
        try {
            const productData: ProductRequest = {
                ...values,
                cost_price: Number(values.cost_price),
                selling_price: Number(values.selling_price),
                markup_percentage: Number(values.markup_percentage || 0),
                tax_rate: Number(values.tax_rate || 0),
                category_id: Number(values.category_id),
            };

            if (editingProduct) {
                await UpdateProdctDetails(editingProduct.id, productData);
                toast.success("Product updated successfully");
            } else {
                await CreateProduct(productData);
                toast.success("Product created successfully");
            }
            handleCancel();
            fetchData();
        } catch (error) {
            console.error("Operation failed:", error);
            toast.error(editingProduct ? "Failed to update product" : "Failed to create product");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await DeleteProduct(id);
            toast.success("Product deleted successfully");
            fetchData();
        } catch (error) {
            console.error("Delete failed:", error);
            toast.error("Failed to delete product");
        }
    };

    const calculateMarkup = (cost: number, selling: number) => {
        if (cost > 0 && selling > 0) {
            return ((selling - cost) / cost * 100).toFixed(2);
        }
        return "0.00";
    };

    const getMarginColor = (percentage: number) => {
        if (percentage >= 30) return 'text-emerald-600';
        if (percentage >= 15) return 'text-amber-600';
        return 'text-rose-600';
    };

    const filteredProducts = products.filter((prod) => {
        const matchesSearch =
            prod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            prod.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
            prod.barcode.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = selectedCategory === "all" || prod.category_id.toString() === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    const getCategoryName = (id: number) => {
        return categories.find(c => c.id === id)?.name || "Uncategorized";
    };

    // Modal Styles
    const modalStyles = {
        header: {
            borderRadius: token.borderRadiusLG,
            padding: token.paddingLG,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
        },
        body: {
            padding: token.paddingLG,
            maxHeight: '70vh',
            overflowY: 'auto' as const,
        },
        footer: {
            borderTop: `1px solid ${token.colorBorderSecondary}`,
            padding: token.paddingLG,
        },
        content: {
            borderRadius: token.borderRadiusLG,
        },
    };

    return (
        <div className="p-6 space-y-8 bg-slate-50/50 min-h-screen">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <PageHeader title="Products Inventory" description=" Manage your catalog, prices, and stock levels efficiently." />

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={fetchData}
                        disabled={loading}
                        className="shadow-sm hover:bg-slate-100 transition-all border-slate-200"
                    >
                        <RefreshCcw className={`h-5 w-5 mr-2 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                    <Button
                        onClick={() => showModal()}
                        size="lg"
                        className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all p-3"
                    >
                        <Plus className="mr-2 h-5 w-5" /> Add New Product
                    </Button>
                </div>
            </div>

            {/* Filters Section */}
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div className="relative flex-1 w-full flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <Input
                            placeholder="Search by name, SKU, or barcode..."
                            className="pl-11 h-12 bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-primary/20 text-lg rounded-md"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {isAdmin && (
                    <div className="w-full sm:w-[240px]">
                        <Select value={selectedShopId} onValueChange={setSelectedShopId}>
                            <SelectTrigger className="h-12 bg-slate-50 border-none rounded-md focus:ring-2 focus:ring-primary/20 text-slate-600">
                                <Building2 className="mr-2 h-4 w-4 text-slate-400" />
                                <SelectValue placeholder="All Shops" />
                            </SelectTrigger>
                            <SelectContent className="rounded-md border-slate-100">
                                <SelectItem value="all">All Shops</SelectItem>
                                {shops.map((shop) => (
                                    <SelectItem key={shop.id} value={shop.id.toString()}>
                                        {shop.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                <div className="w-full sm:w-[240px]">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="h-12 bg-slate-50 border-none rounded-md focus:ring-2 focus:ring-primary/20 text-slate-600">
                            <Layers className="mr-2 h-4 w-4 text-slate-400" />
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent className="rounded-md border-slate-100">
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                {(searchTerm !== "" || selectedCategory !== "all") && (
                    <Button
                        variant="ghost"
                        onClick={() => { setSearchTerm(""); setSelectedCategory("all"); }}
                        className="h-12 text-slate-500 hover:text-primary transition-colors hover:bg-primary/5 rounded-xl px-4"
                    >
                        <FilterX className="mr-2 h-4 w-4" />
                        Reset Filters
                    </Button>
                )}
            </div>

            {/* Products Grid - Compact Cards */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-xl border border-slate-100 p-4 animate-pulse">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="h-10 w-10 bg-slate-200 rounded-lg" />
                                <div className="flex-1">
                                    <div className="h-5 w-3/4 bg-slate-200 rounded" />
                                    <div className="h-4 w-1/2 bg-slate-200 rounded mt-2" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm">
                    <div className="bg-slate-50 p-6 rounded-full mb-6">
                        <Package className="h-16 w-16 text-slate-300" />
                    </div>
                    <h3 className="text-2xl font-semibold text-slate-800">No products found</h3>
                    <p className="text-slate-500 mt-2 max-w-sm text-center">
                        Your search didn&apos;t match any products. Try adjusting your filters or adding a new product.
                    </p>
                    <Button
                        variant="outline"
                        onClick={() => showModal()}
                        className="mt-8 border-primary text-primary hover:bg-primary/5 rounded-xl px-8"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Add First Product
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredProducts.map((product) => {
                        const marginColor = getMarginColor(product.markup_percentage);
                        const profit = product.selling_price - product.cost_price;

                        return (
                            <div
                                key={product.id}
                                className="group bg-white rounded-xl border border-slate-100 hover:border-primary/20 hover:shadow-md transition-all duration-200"
                            >
                                {/* Compact Card Content */}
                                <div className="p-4">
                                    {/* Header with Icon and Actions */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`
                                                h-8 w-8 rounded-lg flex items-center justify-center
                                                ${product.is_active
                                                    ? 'bg-primary/10 text-primary'
                                                    : 'bg-slate-100 text-slate-400'
                                                }
                                            `}>
                                                <Package className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold text-slate-900 text-sm leading-tight">
                                                        {product.name}
                                                    </h3>
                                                    <Badge
                                                        variant={product.is_active ? "default" : "secondary"}
                                                        className={`
                                                            rounded-full px-2 py-0 text-[10px] font-medium
                                                            ${product.is_active
                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                : 'bg-slate-100 text-slate-600 border-slate-200'
                                                            }
                                                        `}
                                                    >
                                                        {product.is_active ? 'Active' : 'Archived'}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                                                        <Tag className="h-3 w-3" />
                                                        {getCategoryName(product.category_id)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions Dropdown */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 rounded-lg hover:bg-slate-100"
                                                >
                                                    <MoreHorizontal className="h-3.5 w-3.5 text-slate-500" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-[140px] rounded-xl">
                                                <DropdownMenuItem onClick={() => showModal(product)} className="py-1.5 text-xs">
                                                    <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <Popconfirm
                                                    title="Delete Product"
                                                    description="Are you sure?"
                                                    onConfirm={() => handleDelete(product.id)}
                                                    okText="Delete"
                                                    cancelText="Cancel"
                                                    okButtonProps={{ danger: true, size: 'small' }}
                                                >
                                                    <DropdownMenuItem
                                                        className="text-red-600 focus:text-red-600 py-1.5 text-xs"
                                                        onSelect={(e) => e.preventDefault()}
                                                    >
                                                        <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                                                    </DropdownMenuItem>
                                                </Popconfirm>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    {/* SKU and Barcode Row */}
                                    <div className="flex items-center justify-between mb-3 text-[10px]">
                                        <Tooltip title={`SKU: ${product.sku}`}>
                                            <span className="font-mono text-slate-400 truncate max-w-[80px]">
                                                {product.sku}
                                            </span>
                                        </Tooltip>
                                        <Tooltip title={product.barcode || 'No barcode'}>
                                            <span className="flex items-center gap-1 text-slate-400">
                                                <Barcode className="h-3 w-3" />
                                                <span className="truncate max-w-[60px]">
                                                    {product.barcode || 'No barcode'}
                                                </span>
                                            </span>
                                        </Tooltip>
                                    </div>

                                    {/* Price Row */}
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <span className="text-[10px] text-slate-500 block">Selling</span>
                                            <span className="text-base font-bold text-slate-900">
                                                ₵{product.selling_price.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] text-slate-500 block">Cost</span>
                                            <span className="text-sm text-slate-600">
                                                ₵{product.cost_price.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Margin and Profit Row */}
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-1">
                                            <span className={`text-xs font-medium ${marginColor}`}>
                                                {product.markup_percentage}%
                                            </span>
                                            <span className="text-[10px] text-slate-400">margin</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {profit >= 0 ? (
                                                <TrendingUp className="h-3 w-3 text-emerald-500" />
                                            ) : (
                                                <TrendingDown className="h-3 w-3 text-rose-500" />
                                            )}
                                            <span className={`text-xs font-medium ${profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                ₵{Math.abs(profit).toLocaleString()}
                                                {profit < 0 ? ' loss' : ''}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Mini Progress Bar */}
                                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden mb-3">
                                        <div
                                            className={`h-full rounded-full ${product.markup_percentage >= 30
                                                ? 'bg-emerald-500'
                                                : product.markup_percentage >= 15
                                                    ? 'bg-amber-500'
                                                    : 'bg-rose-500'
                                                }`}
                                            style={{ width: `${Math.min(product.markup_percentage, 100)}%` }}
                                        />
                                    </div>

                                    {/* Tax Indicator (if applicable) */}
                                    {product.is_taxable && (
                                        <div className="flex items-center gap-1 text-[10px] bg-amber-50 text-amber-700 px-2 py-1 rounded-lg mb-2">
                                            <Percent className="h-3 w-3" />
                                            <span>Tax {product.tax_rate}%</span>
                                        </div>
                                    )}

                                    {/* Edit Button */}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full h-8 border-slate-200 hover:border-primary hover:text-primary hover:bg-primary/5 rounded-lg text-xs font-medium mt-1 transition-all flex items-center justify-center gap-1.5"
                                        onClick={() => showDetailsModal(product)}
                                    >
                                        <Eye className="h-3.5 w-3.5" />
                                        View Details
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Product Modal */}
            <Modal
                open={isModalVisible}
                onCancel={handleCancel}
                footer={null}
                width={720}
                centered
                closable={false}
                styles={modalStyles}
                modalRender={(modal) => (
                    <div className="ant-modal-custom">
                        {modal}
                    </div>
                )}
            >
                {/* Custom Header */}
                <div style={modalStyles.header} className="flex items-center justify-between">
                    <Space size="middle" align="center">
                        <div className="p-2.5 bg-primary/10 rounded-xl">
                            {editingProduct ? (
                                <Pencil className="h-5 w-5 text-primary" />
                            ) : (
                                <Plus className="h-5 w-5 text-primary" />
                            )}
                        </div>
                        <div>
                            <Text strong style={{ fontSize: token.fontSizeLG, color: token.colorText }}>
                                {editingProduct ? "Edit Product" : "Create New Product"}
                            </Text>
                            <Text type="secondary" style={{ fontSize: token.fontSizeSM, display: 'block' }}>
                                {editingProduct ? "Update product information" : "Add a new product to your inventory"}
                            </Text>
                        </div>
                    </Space>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCancel}
                        className="rounded-full h-8 w-8 hover:bg-slate-100"
                    >
                        <XCircle className="h-4 w-4" />
                    </Button>
                </div>

                {/* Form Content */}
                <div style={modalStyles.body}>
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                        requiredMark={false}
                        size="middle"
                    >
                        {/* Basic Information Section */}
                        <div className="mb-6">
                            <Text strong className="text-sm text-slate-700 flex items-center gap-2 mb-4">
                                <Package className="h-4 w-4" />
                                Basic Information
                            </Text>

                            <Row gutter={16}>
                                <Col span={16}>
                                    <Form.Item
                                        name="name"
                                        label={<Text type="secondary">Product Name</Text>}
                                        rules={[{ required: true, message: 'Product name is required' }]}
                                    >
                                        <AntInput
                                            placeholder="e.g., Wireless Headphones"
                                            className="rounded-lg"
                                            size="large"
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item
                                        name="category_id"
                                        label={<Text type="secondary">Category</Text>}
                                        rules={[{ required: true, message: 'Category is required' }]}
                                    >
                                        <Select
                                            value={form.getFieldValue("category_id")?.toString()}
                                            onValueChange={(value) => form.setFieldsValue({ category_id: Number(value) })}
                                        >
                                            <SelectTrigger className="h-10 rounded-lg border-slate-200">
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories.map(c => (
                                                    <SelectItem key={c.id} value={c.id.toString()}>
                                                        {c.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item
                                name="description"
                                label={<Text type="secondary">Description</Text>}
                            >
                                <AntInput.TextArea
                                    rows={3}
                                    placeholder="Enter product description..."
                                    className="rounded-lg"
                                />
                            </Form.Item>
                        </div>

                        <Divider className="my-6" />

                        {/* Identification Section */}
                        <div className="mb-6">
                            <Text strong className="text-sm text-slate-700 flex items-center gap-2 mb-4">
                                <Barcode className="h-4 w-4" />
                                Identification
                            </Text>

                            <Row gutter={16}>
                                <Col span={8}>
                                    <Form.Item
                                        name="brand"
                                        label={<Text type="secondary">Brand</Text>}
                                    >
                                        <AntInput
                                            placeholder="e.g., Sony"
                                            size="large"
                                            className="rounded-lg"
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item
                                        name="sku"
                                        label={<Text type="secondary">SKU</Text>}
                                    >
                                        <AntInput
                                            placeholder="SKU-12345"
                                            size="large"
                                            className="rounded-lg font-mono"
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item
                                        name="barcode"
                                        label={<Text type="secondary">Barcode</Text>}
                                    >
                                        <AntInput
                                            placeholder="EAN / UPC"
                                            size="large"
                                            className="rounded-lg font-mono"
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </div>

                        <Divider className="my-6" />

                        {/* Pricing Section */}
                        <div className="mb-6">
                            <Text strong className="text-sm text-slate-700 flex items-center gap-2 mb-4">
                                <DollarSign className="h-4 w-4" />
                                Pricing & Tax
                            </Text>

                            <Row gutter={16}>
                                <Col span={8}>
                                    <Form.Item
                                        name="cost_price"
                                        label={<Text type="secondary">Cost Price (GHS)</Text>}
                                        rules={[{ required: true, message: 'Required' }]}
                                    >
                                        <InputNumber
                                            min={0}
                                            className="w-full rounded-lg"
                                            size="large"
                                            formatter={(value) => `₵ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                            parser={(value) => value?.replace(/\₵\s?|(,*)/g, '') as any}
                                            onChange={(value) => {
                                                const cost = Number(value || 0);
                                                const selling = form.getFieldValue("selling_price") || 0;
                                                if (cost > 0 && selling > 0) {
                                                    form.setFieldsValue({
                                                        markup_percentage: calculateMarkup(cost, selling)
                                                    });
                                                }
                                            }}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item
                                        name="selling_price"
                                        label={<Text type="secondary">Selling Price (GHS)</Text>}
                                        rules={[{ required: true, message: 'Required' }]}
                                    >
                                        <InputNumber
                                            min={0}
                                            className="w-full rounded-lg"
                                            size="large"
                                            formatter={(value) => `₵ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                            parser={(value) => value?.replace(/\₵\s?|(,*)/g, '') as any}
                                            onChange={(value) => {
                                                const selling = Number(value || 0);
                                                const cost = form.getFieldValue("cost_price") || 0;
                                                if (cost > 0 && selling > 0) {
                                                    form.setFieldsValue({
                                                        markup_percentage: calculateMarkup(cost, selling)
                                                    });
                                                }
                                            }}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={4}>
                                    <Form.Item
                                        name="markup_percentage"
                                        label={<Text type="secondary">Markup %</Text>}
                                    >
                                        <InputNumber
                                            disabled
                                            className="w-full rounded-lg bg-slate-50"
                                            size="large"
                                            formatter={(value) => `${value}%`}
                                            parser={(value) => value?.replace('%', '') as any}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={4}>
                                    <Form.Item
                                        name="tax_rate"
                                        label={<Text type="secondary">Tax Rate %</Text>}
                                    >
                                        <InputNumber
                                            min={0}
                                            max={100}
                                            className="w-full rounded-lg"
                                            size="large"
                                            formatter={(value) => `${value}%`}
                                            parser={(value) => value?.replace('%', '') as any}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </div>

                        <Divider className="my-6" />

                        {/* Status Toggles */}
                        <Row gutter={16}>
                            <Col span={12}>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Text strong className="text-sm text-slate-700">Taxable</Text>
                                            <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                                                Apply tax rate to this product
                                            </Text>
                                        </div>
                                        <Form.Item name="is_taxable" valuePropName="checked" noStyle>
                                            <Switch
                                                checkedChildren={<CheckCircle className="h-3 w-3" />}
                                                unCheckedChildren={<XCircle className="h-3 w-3" />}
                                            />
                                        </Form.Item>
                                    </div>
                                </div>
                            </Col>
                            <Col span={12}>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Text strong className="text-sm text-slate-700">Active Status</Text>
                                            <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                                                Visible in POS shopfront
                                            </Text>
                                        </div>
                                        <Form.Item name="is_active" valuePropName="checked" noStyle>
                                            <Switch
                                                checkedChildren={<CheckCircle className="h-3 w-3" />}
                                                unCheckedChildren={<XCircle className="h-3 w-3" />}
                                            />
                                        </Form.Item>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    </Form>
                </div>

                {/* Footer Actions */}
                <div style={modalStyles.footer} className="flex justify-end gap-3">
                    <Button
                        variant="outline"
                        onClick={handleCancel}
                        className="rounded-lg h-10 px-6"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => form.submit()}
                        disabled={submitting}
                        className="rounded-lg h-10 px-8 bg-primary hover:bg-primary/90"
                    >
                        {submitting ? (
                            <>
                                <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            editingProduct ? "Update Product" : "Create Product"
                        )}
                    </Button>
                </div>
            </Modal>

            {/* Product Details Modal */}
            <Modal
                open={isDetailsModalVisible}
                onCancel={handleDetailsCancel}
                footer={null}
                width={700}
                centered
                closable={false}
                styles={{
                    ...modalStyles,
                    body: { padding: 0 }
                }}
                modalRender={(modal) => (
                    <div className="ant-modal-details-custom">
                        {modal}
                    </div>
                )}
            >
                {viewingProduct && (
                    <div className="flex flex-col bg-white">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                    <Package className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg font-semibold text-slate-900">{viewingProduct.name}</h2>
                                        <span className={`
                                text-xs px-2 py-0.5 rounded-full font-medium
                                ${viewingProduct.is_active
                                                ? 'bg-emerald-50 text-emerald-700'
                                                : 'bg-rose-50 text-rose-700'
                                            }
                            `}>
                                            {viewingProduct.is_active ? 'Active' : 'Archived'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <Tag className="h-3.5 w-3.5" />
                                            {getCategoryName(viewingProduct.category_id)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Building2 className="h-3.5 w-3.5" />
                                            {viewingProduct.brand || 'No Brand'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleDetailsCancel}
                                className="h-8 w-8 rounded-lg hover:bg-slate-100"
                            >
                                <X className="h-4 w-4 text-slate-400" />
                            </Button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                            {/* Quick Stats */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-slate-50 rounded-lg p-3">
                                    <p className="text-xs text-slate-500 mb-1">Selling Price</p>
                                    <p className="text-lg font-bold text-slate-900">₵{viewingProduct.selling_price.toLocaleString()}</p>
                                </div>
                                <div className="bg-slate-50 rounded-lg p-3">
                                    <p className="text-xs text-slate-500 mb-1">Cost Price</p>
                                    <p className="text-lg font-bold text-slate-900">₵{viewingProduct.cost_price.toLocaleString()}</p>
                                </div>
                                <div className="bg-slate-50 rounded-lg p-3">
                                    <p className="text-xs text-slate-500 mb-1">Profit</p>
                                    <p className={`text-lg font-bold ${(viewingProduct.selling_price - viewingProduct.cost_price) >= 0
                                        ? 'text-emerald-600'
                                        : 'text-rose-600'
                                        }`}>
                                        ₵{(viewingProduct.selling_price - viewingProduct.cost_price).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            {/* Margin Bar */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500">Gross Margin</span>
                                    <span className={`font-medium ${viewingProduct.markup_percentage >= 30
                                        ? 'text-emerald-600'
                                        : viewingProduct.markup_percentage >= 15
                                            ? 'text-amber-600'
                                            : 'text-rose-600'
                                        }`}>
                                        {viewingProduct.markup_percentage}%
                                    </span>
                                </div>
                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${viewingProduct.markup_percentage >= 30
                                            ? 'bg-emerald-500'
                                            : viewingProduct.markup_percentage >= 15
                                                ? 'bg-amber-500'
                                                : 'bg-rose-500'
                                            }`}
                                        style={{ width: `${Math.min(viewingProduct.markup_percentage, 100)}%` }}
                                    />
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Left Column */}
                                <div className="space-y-4">
                                    <div className="border border-slate-100 rounded-lg p-3">
                                        <p className="text-xs text-slate-400 mb-1">SKU</p>
                                        <p className="text-sm font-mono text-slate-700">{viewingProduct.sku || 'N/A'}</p>
                                    </div>
                                    <div className="border border-slate-100 rounded-lg p-3">
                                        <p className="text-xs text-slate-400 mb-1">Barcode</p>
                                        <p className="text-sm font-mono text-slate-700">{viewingProduct.barcode || 'N/A'}</p>
                                    </div>
                                    <div className="border border-slate-100 rounded-lg p-3">
                                        <p className="text-xs text-slate-400 mb-1">Tax Rate</p>
                                        <p className="text-sm text-slate-700">{viewingProduct.tax_rate}%</p>
                                    </div>
                                </div>

                                {/* Right Column */}
                                <div className="space-y-4">
                                    <div className="border border-slate-100 rounded-lg p-3">
                                        <p className="text-xs text-slate-400 mb-1">Tax Status</p>
                                        <div className="flex items-center gap-1.5">
                                            {viewingProduct.is_taxable ? (
                                                <>
                                                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                                                    <span className="text-sm text-slate-700">Taxable</span>
                                                </>
                                            ) : (
                                                <>
                                                    <XCircle className="h-4 w-4 text-slate-400" />
                                                    <span className="text-sm text-slate-700">Non-taxable</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="border border-slate-100 rounded-lg p-3">
                                        <p className="text-xs text-slate-400 mb-1">Visibility</p>
                                        <div className="flex items-center gap-1.5">
                                            <Eye className={`h-4 w-4 ${viewingProduct.is_active ? 'text-blue-500' : 'text-slate-400'}`} />
                                            <span className="text-sm text-slate-700">
                                                {viewingProduct.is_active ? 'Visible in POS' : 'Hidden'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="border border-slate-100 rounded-lg p-3">
                                        <p className="text-xs text-slate-400 mb-1">Description</p>
                                        <p className="text-sm text-slate-600 line-clamp-2">
                                            {viewingProduct.description || 'No description'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Timestamps */}
                            <div className="bg-slate-50 rounded-lg p-3 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                    <span className="text-slate-500">Created:</span>
                                    <span className="text-slate-700">
                                        {new Date(viewingProduct.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                                    <span className="text-slate-500">Updated:</span>
                                    <span className="text-slate-700">
                                        {new Date(viewingProduct.updated_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            {/* Inventory Information Section */}
                            {viewingProduct.inventory && (
                                <div className="pt-4 border-t border-slate-100">
                                    <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-4">
                                        <Package className="h-4 w-4 text-primary" />
                                        Inventory & Stock Levels
                                    </h4>
                                    
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                                            <p className="text-[10px] text-emerald-600 font-medium uppercase tracking-wider mb-1">Current Stock</p>
                                            <p className="text-xl font-bold text-emerald-700">{viewingProduct.inventory.current_stock} <span className="text-xs font-normal text-emerald-500">{viewingProduct.inventory.unit_of_measurement || 'units'}</span></p>
                                        </div>
                                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                                            <p className="text-[10px] text-amber-600 font-medium uppercase tracking-wider mb-1">Min Level</p>
                                            <p className="text-xl font-bold text-amber-700">{viewingProduct.inventory.minimum_stock}</p>
                                        </div>
                                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                                            <p className="text-[10px] text-blue-600 font-medium uppercase tracking-wider mb-1">Reorder Point</p>
                                            <p className="text-xl font-bold text-blue-700">{viewingProduct.inventory.reorder_point}</p>
                                        </div>
                                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                                            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-1">Max Capacity</p>
                                            <p className="text-xl font-bold text-slate-700">{viewingProduct.inventory.maximum_stock || '—'}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 bg-slate-50/50 rounded-xl p-4 border border-slate-100">
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Storage Location</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-xs font-medium text-slate-600">Aisle {viewingProduct.inventory.aisle || 'N/A'}</span>
                                                    <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-xs font-medium text-slate-600">Shelf {viewingProduct.inventory.shelf || 'N/A'}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-700 font-medium mt-2">{viewingProduct.inventory.bin_location || 'No specific bin location assigned'}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-3 text-right">
                                            <div>
                                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Unit of Measure</p>
                                                <p className="text-sm font-semibold text-slate-700 mt-0.5">{viewingProduct.inventory.unit_of_measurement || 'Units'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Last Restocked</p>
                                                <p className="text-sm font-semibold text-slate-700 mt-0.5">
                                                    {viewingProduct.inventory.last_restocked 
                                                        ? new Date(viewingProduct.inventory.last_restocked).toLocaleDateString()
                                                        : 'Never'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDetailsCancel}
                                className="h-9 px-4 rounded-lg text-sm"
                            >
                                Close
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => {
                                    handleDetailsCancel();
                                    showModal(viewingProduct);
                                }}
                                className="h-9 px-4 rounded-lg bg-primary hover:bg-primary/90 text-sm gap-1.5"
                            >
                                <Pencil className="h-3.5 w-3.5" />
                                Edit
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}