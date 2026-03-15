export interface Product {
  id: string;
  name: string;
  categories: string[];
  price: number; // cents
  image: string;
  stock: 'in_stock' | 'low_stock' | 'out_of_stock';
  workstation: string;
  modifiers: number;
  tags: string[];
}
