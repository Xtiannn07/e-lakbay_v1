import React from 'react';
import { ShowcaseCard } from '../components/ShowcaseCard';

interface ProductSectionProps {
  onRate: (name: string) => void;
}

const products = [
  {
    name: 'Ilocos Souvenir Bundle',
    destination: 'Vigan Heritage',
    description: 'A curated set of woven crafts and local delicacies to remember your trip.',
    imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Heritage Coffee Pack',
    destination: 'Candon Beach',
    description: 'Locally roasted beans with notes of cacao and caramel, packed fresh weekly.',
    imageUrl: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=600&q=80',
  },
];

export const ProductSection: React.FC<ProductSectionProps> = ({ onRate }) => {
  return (
    <section id="products" className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-semibold">Products</h2>
          <p className="text-sm text-white/60">Featured items curated for travelers.</p>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        {products.map((product) => (
          <ShowcaseCard
            key={product.name}
            title={product.name}
            meta={`Destination: ${product.destination}`}
            description={product.description}
            imageUrl={product.imageUrl}
            onRate={() => onRate(product.name)}
          />
        ))}
      </div>
    </section>
  );
};
