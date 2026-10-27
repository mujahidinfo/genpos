import { createContext, use, useReducer, type PropsWithChildren } from 'react';

import type { Product } from '@/api/types';

export type CartLine = {
  variantId: string;
  productId: string;
  name: string;
  /** null for simple products (hidden default variant). */
  variantName: string | null;
  sku: string | null;
  price: number;
  quantity: number;
};

type CartState = {
  lines: CartLine[];
};

type Action =
  | { type: 'add'; line: Omit<CartLine, 'quantity'>; quantity: number }
  | { type: 'setQuantity'; variantId: string; quantity: number }
  | { type: 'clear' };

function reducer(state: CartState, action: Action): CartState {
  switch (action.type) {
    case 'add': {
      const existing = state.lines.find((l) => l.variantId === action.line.variantId);
      // Newest on top: the cashier looks at what they just scanned.
      const lines = existing
        ? [
            { ...existing, quantity: existing.quantity + action.quantity },
            ...state.lines.filter((l) => l !== existing),
          ]
        : [{ ...action.line, quantity: action.quantity }, ...state.lines];
      return { lines };
    }
    case 'setQuantity':
      return {
        lines:
          action.quantity <= 0
            ? state.lines.filter((l) => l.variantId !== action.variantId)
            : state.lines.map((l) =>
                l.variantId === action.variantId ? { ...l, quantity: action.quantity } : l,
              ),
      };
    case 'clear':
      return { lines: [] };
  }
}

/** Build a cart line for one variant of a product. */
export function lineFor(product: Product, variantId: string): Omit<CartLine, 'quantity'> {
  const variant = product.variants.find((v) => v.id === variantId);
  if (!variant) throw new Error(`Variant ${variantId} not on ${product.name}`);
  return {
    variantId,
    productId: product.id,
    name: product.name,
    variantName: variant.isDefault ? null : variant.name,
    sku: variant.sku ?? product.sku,
    price: variant.price ?? product.price,
  };
}

type CartContextValue = CartState & {
  itemCount: number;
  subtotal: number;
  add: (line: Omit<CartLine, 'quantity'>, quantity?: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const value = use(CartContext);
  if (!value) throw new Error('useCart must be used inside <CartProvider>');
  return value;
}

export function CartProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(reducer, { lines: [] });

  const value: CartContextValue = {
    ...state,
    itemCount: state.lines.reduce((n, l) => n + l.quantity, 0),
    subtotal: state.lines.reduce((s, l) => s + l.price * l.quantity, 0),
    add: (line, quantity = 1) => dispatch({ type: 'add', line, quantity }),
    setQuantity: (variantId, quantity) => dispatch({ type: 'setQuantity', variantId, quantity }),
    clear: () => dispatch({ type: 'clear' }),
  };

  return <CartContext value={value}>{children}</CartContext>;
}
