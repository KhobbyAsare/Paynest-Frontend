import { create } from "zustand";
import { ProductResponse } from "@/interfaces/products";

interface CartItemData {
    product: ProductResponse;
    quantity: number;
    specialInstructions?: string;
}

interface SalesState {
    isOrderMode: boolean; // false = walk-in, true = order
    cart: Record<number, CartItemData>;
    paymentMethod: "bank transfer" | "mobile transfer" | "cash";

    // Actions
    toggleOrderMode: () => void;
    setOrderMode: (isOrder: boolean) => void;
    addToCart: (product: ProductResponse) => void;
    updateCartQuantity: (productId: number, delta: number, instructions?: string) => void;
    removeFromCart: (productId: number) => void;
    clearCart: () => void;
    setPaymentMethod: (method: "bank transfer" | "mobile transfer" | "cash") => void;
}

export const useSalesStore = create<SalesState>((set) => ({
    isOrderMode: false,
    cart: {},
    paymentMethod: "bank transfer",

    toggleOrderMode: () => set((state) => ({ isOrderMode: !state.isOrderMode })),
    setOrderMode: (isOrder: boolean) => set({ isOrderMode: isOrder }),

    addToCart: (product: ProductResponse) => set((state: SalesState) => {
        const currentItem = state.cart[product.id];
        return {
            cart: {
                ...state.cart,
                [product.id]: {
                    product,
                    quantity: (currentItem?.quantity || 0) + 1,
                },
            },
        };
    }),

    updateCartQuantity: (productId: number, delta: number, instructions?: string) => set((state: SalesState) => {
        const currentItem = state.cart[productId];
        if (!currentItem) return state;

        const newQuantity = currentItem.quantity + delta;

        if (newQuantity <= 0) {
            const newCart = { ...state.cart };
            delete newCart[productId];
            return { cart: newCart };
        }

        return {
            cart: {
                ...state.cart,
                [productId]: {
                    ...currentItem,
                    quantity: newQuantity,
                    specialInstructions: instructions !== undefined ? instructions : currentItem.specialInstructions,
                },
            },
        };
    }),

    removeFromCart: (productId: number) => set((state: SalesState) => {
        const newCart = { ...state.cart };
        delete newCart[productId];
        return { cart: newCart };
    }),

    clearCart: () => set({ cart: {} }),

    setPaymentMethod: (method: "bank transfer" | "mobile transfer" | "cash") => set({ paymentMethod: method }),
}));
